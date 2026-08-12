<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Enums\EquipmentStatus;
use App\Enums\ImportanceLevel;
use App\Enums\OrganizationType;
use App\Enums\AllocationStatus;
use App\Enums\TransferStatus;
use App\Enums\LoanStatus;
use App\Enums\InventoryStatus;
use App\Enums\InventoryItemResult;
use App\Enums\ContractStatus;
use App\Enums\LiquidationStatus;
use App\Enums\RepairStatus;
use App\Enums\DamageReportStatus;
use App\Enums\DamagePriority;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OptionController extends Controller
{
    /**
     * Get combobox options dynamically.
     * Query all options or filter with ?types=equipment_status,importance_level
     */
    public function index(Request $request): JsonResponse
    {
        $allOptions = $this->getAllOptions();

        if ($request->has('types')) {
            $requestedTypes = array_filter(array_map('trim', explode(',', $request->query('types'))));
            $filtered = [];
            foreach ($requestedTypes as $type) {
                if (isset($allOptions[$type])) {
                    $filtered[$type] = $allOptions[$type];
                }
            }
            return response()->json([
                'success' => true,
                'data'    => $filtered,
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => $allOptions,
        ]);
    }

    /**
     * Get option list for a single specific type.
     */
    public function show(string $type): JsonResponse
    {
        $allOptions = $this->getAllOptions();

        if (!isset($allOptions[$type])) {
            return response()->json([
                'success' => false,
                'message' => "Option type '{$type}' not found.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $allOptions[$type],
        ]);
    }

    private function getAllOptions(): array
    {
        return [
            'equipment_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
                'color' => method_exists($case, 'color') ? $case->color() : null,
            ], EquipmentStatus::cases()),

            'importance_level' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], ImportanceLevel::cases()),

            'organization_type' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], OrganizationType::cases()),

            'repair_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], RepairStatus::cases()),

            'damage_report_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], DamageReportStatus::cases()),

            'damage_priority' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], DamagePriority::cases()),

            'transfer_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], TransferStatus::cases()),

            'allocation_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], AllocationStatus::cases()),

            'loan_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], LoanStatus::cases()),

            'inventory_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], InventoryStatus::cases()),

            'inventory_item_result' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], InventoryItemResult::cases()),

            'contract_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], ContractStatus::cases()),

            'liquidation_status' => array_map(fn($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ], LiquidationStatus::cases()),

            'roles' => [
                ['value' => 'admin',            'label' => 'Quản trị viên'],
                ['value' => 'pvtttby',          'label' => 'Phòng Vật tư – TTBYT'],
                ['value' => 'department_staff', 'label' => 'Nhân viên khoa/phòng'],
                ['value' => 'technician',       'label' => 'Kỹ thuật viên'],
                ['value' => 'leader',           'label' => 'Ban lãnh đạo'],
            ],
        ];
    }
}
