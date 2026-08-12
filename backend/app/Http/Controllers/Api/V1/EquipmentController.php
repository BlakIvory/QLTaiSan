<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EquipmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = Equipment::with(['equipmentType', 'manufacturer', 'organization', 'location']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('equipment_code', 'like', "%{$search}%")
                  ->orWhere('asset_code', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('serial', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Organization filter
        if ($orgId = $request->input('organization_id')) {
            $query->where('organization_id', $orgId);
        }

        // Equipment type filter
        if ($typeId = $request->input('equipment_type_id')) {
            $query->where('equipment_type_id', $typeId);
        }

        $perPage = $request->input('per_page', 15);
        $equipment = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $equipment->items(),
            'meta'    => [
                'current_page' => $equipment->currentPage(),
                'last_page'    => $equipment->lastPage(),
                'per_page'     => $equipment->perPage(),
                'total'        => $equipment->total(),
                'from'         => $equipment->firstItem(),
                'to'           => $equipment->lastItem(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'equipment_type_id'   => 'required|exists:equipment_types,id',
            'asset_code'          => 'nullable|string|max:100',
            'model'               => 'nullable|string|max:100',
            'serial'              => 'nullable|string|max:100',
            'manufacturer_id'     => 'nullable|exists:manufacturers,id',
            'country_id'          => 'nullable|exists:countries,id',
            'year_of_manufacture' => 'nullable|integer|min:1900|max:' . date('Y'),
            'purchase_date'       => 'nullable|date',
            'in_use_date'         => 'nullable|date',
            'original_price'      => 'nullable|numeric|min:0',
            'current_value'       => 'nullable|numeric|min:0',
            'funding_source_id'   => 'nullable|exists:funding_sources,id',
            'supplier_id'         => 'nullable|exists:suppliers,id',
            'contract_number'     => 'nullable|string|max:100',
            'warranty_start'      => 'nullable|date',
            'warranty_end'        => 'nullable|date',
            'organization_id'     => 'nullable|exists:organizations,id',
            'location_id'         => 'nullable|exists:locations,id',
            'importance_level'    => 'required|string',
            'requires_maintenance'=> 'boolean',
            'requires_inspection' => 'boolean',
            'maintenance_cycle_days' => 'nullable|integer',
            'inspection_cycle_days'  => 'nullable|integer',
            'notes'               => 'nullable|string',
        ]);

        // Generate equipment code if not provided
        $code = 'TB-' . date('Y') . '-' . str_pad(Equipment::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
        $validated['equipment_code'] = $code;
        $validated['status'] = EquipmentStatus::PENDING_RECEIPT->value;
        $validated['created_by'] = auth()->id();

        // Default managing organization to Phòng Vật tư - TTBYT (Phòng CSVC)
        if (empty($validated['organization_id'])) {
            $defaultOrg = \App\Models\Organization::where('code', 'P-VAT-TU')
                ->orWhere('code', 'P-VT-TTBYT')
                ->orWhere('type', 'WAREHOUSE')
                ->first();
            if ($defaultOrg) {
                $validated['organization_id'] = $defaultOrg->id;
            }
        }

        $equipment = Equipment::create($validated);

        $this->auditLog->log('CREATE', 'equipment', $equipment->id, null, $equipment->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Tạo mới thiết bị thành công.',
            'data'    => $equipment->load(['equipmentType', 'organization', 'location']),
        ], 201);
    }

    public function show(Equipment $equipment): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $equipment->load([
                'equipmentType', 'manufacturer', 'country', 'fundingSource',
                'supplier', 'organization', 'location', 'responsibleUser',
                'images', 'statusHistories.changedBy', 'locationHistories',
                'repairs', 'maintenancePlans', 'inspections',
            ]),
        ]);
    }

    public function update(Request $request, Equipment $equipment): JsonResponse
    {
        $oldData = $equipment->toArray();

        $validated = $request->validate([
            'name'                => 'sometimes|string|max:255',
            'equipment_type_id'   => 'sometimes|exists:equipment_types,id',
            'asset_code'          => 'nullable|string|max:100',
            'model'               => 'nullable|string|max:100',
            'serial'              => 'nullable|string|max:100',
            'manufacturer_id'     => 'nullable|exists:manufacturers,id',
            'country_id'          => 'nullable|exists:countries,id',
            'year_of_manufacture' => 'nullable|integer',
            'purchase_date'       => 'nullable|date',
            'in_use_date'         => 'nullable|date',
            'original_price'      => 'nullable|numeric|min:0',
            'current_value'       => 'nullable|numeric|min:0',
            'organization_id'     => 'nullable|exists:organizations,id',
            'location_id'         => 'nullable|exists:locations,id',
            'importance_level'    => 'sometimes|string',
            'notes'               => 'nullable|string',
        ]);

        $validated['updated_by'] = auth()->id();
        $equipment->update($validated);

        $this->auditLog->log('UPDATE', 'equipment', $equipment->id, $oldData, $equipment->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông tin thiết bị thành công.',
            'data'    => $equipment->fresh(['equipmentType', 'organization', 'location']),
        ]);
    }

    public function destroy(Request $request, Equipment $equipment): JsonResponse
    {
        $oldData = $equipment->toArray();
        $equipment->delete();

        $this->auditLog->log('DELETE', 'equipment', $equipment->id, $oldData, null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa thiết bị thành công.',
        ]);
    }

    public function changeStatus(Request $request, Equipment $equipment): JsonResponse
    {
        $request->validate([
            'status' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        $newStatus = EquipmentStatus::from($request->status);

        if (!$equipment->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Không thể chuyển trạng thái từ {$equipment->status->label()} sang {$newStatus->label()}.",
            ], 422);
        }

        $oldStatus = $equipment->status;
        $equipment->update(['status' => $newStatus]);

        // Record history
        $equipment->statusHistories()->create([
            'from_status' => $oldStatus->value,
            'to_status'   => $newStatus->value,
            'reason'      => $request->reason,
            'changed_by'  => auth()->id(),
            'changed_at'  => now(),
        ]);

        $this->auditLog->log('CHANGE_STATUS', 'equipment', $equipment->id,
            ['status' => $oldStatus->value], ['status' => $newStatus->value], $request);

        return response()->json([
            'success' => true,
            'message' => 'Đã thay đổi trạng thái thiết bị thành công.',
            'data'    => $equipment->fresh(),
        ]);
    }

    public function scanQr(string $code): JsonResponse
    {
        $equipment = Equipment::where('equipment_code', $code)
            ->orWhere('qr_code', $code)
            ->with(['equipmentType', 'organization', 'location'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => $equipment,
        ]);
    }
}
