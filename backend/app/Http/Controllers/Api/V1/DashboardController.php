<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Repair;
use App\Models\Organization;
use App\Models\DamageReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $stats = [
            'total_equipment'         => Equipment::count(),
            'in_use'                  => Equipment::where('status', 'IN_USE')->count(),
            'under_repair'            => Equipment::where('status', 'UNDER_REPAIR')->count(),
            'under_maintenance'       => Equipment::where('status', 'UNDER_MAINTENANCE')->count(),
            'pending_liquidation'     => Equipment::where('status', 'PENDING_LIQUIDATION')->count(),
            'warranty_expiring_soon'  => Equipment::warrantyExpiringSoon(30)->count(),
            'maintenance_overdue'     => Equipment::maintenanceOverdue()->count(),
            'inspection_expired'      => Equipment::whereNotNull('next_inspection_date')
                                                ->where('next_inspection_date', '<', now())
                                                ->count(),
            'pending_repairs'         => Repair::whereIn('status', ['NEW', 'INSPECTING', 'WAITING_APPROVAL'])->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    public function charts(): JsonResponse
    {
        // 1. Repair costs by month (last 6 months)
        $repairCosts = Repair::select(
                DB::raw("strftime('%m/%Y', created_at) as month"),
                DB::raw("SUM(total_cost) as total_cost")
            )
            ->groupBy('month')
            ->orderBy('created_at', 'asc')
            ->limit(6)
            ->get();

        // 2. Equipment by status
        $byStatus = Equipment::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status,
                    'label'  => $item->status instanceof \App\Enums\EquipmentStatus ? $item->status->label() : (string)$item->status,
                    'count'  => $item->count,
                ];
            });

        // 3. Equipment by organization
        $byOrganization = Organization::withCount('equipment')
            ->having('equipment_count', '>', 0)
            ->get()
            ->map(function ($org) {
                return [
                    'name'  => $org->name,
                    'count' => $org->equipment_count,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'repair_costs'    => $repairCosts,
                'by_status'       => $byStatus,
                'by_organization' => $byOrganization,
            ],
        ]);
    }

    public function alerts(): JsonResponse
    {
        $alerts = [];

        // Maintenance overdue alerts
        $overdueMaint = Equipment::maintenanceOverdue()->with('organization')->take(5)->get();
        foreach ($overdueMaint as $eq) {
            $alerts[] = [
                'severity'          => 'critical',
                'message'           => "Thiết bị {$eq->name} ({$eq->equipment_code}) đã quá hạn bảo trì!",
                'equipment_name'    => $eq->name,
                'organization_name' => $eq->organization?->name ?? 'Chưa phân bổ',
            ];
        }

        // Warranty expiring alerts
        $expiringWarranty = Equipment::warrantyExpiringSoon(30)->with('organization')->take(5)->get();
        foreach ($expiringWarranty as $eq) {
            $alerts[] = [
                'severity'          => 'warning',
                'message'           => "Thiết bị {$eq->name} ({$eq->equipment_code}) sắp hết hạn bảo hành.",
                'equipment_name'    => $eq->name,
                'organization_name' => $eq->organization?->name ?? 'Chưa phân bổ',
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => $alerts,
        ]);
    }
}
