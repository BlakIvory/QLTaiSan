<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DamageReport;
use App\Models\Equipment;
use App\Enums\EquipmentStatus;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DamageReportController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = DamageReport::with(['equipment', 'organization', 'reportedByUser']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function ($eqQ) use ($search) {
                      $eqQ->where('name', 'like', "%{$search}%")
                          ->orWhere('equipment_code', 'like', "%{$search}%");
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $reports = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $reports,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'description'  => 'required|string',
            'priority'     => 'required|string',
            'detected_at'  => 'required|date',
        ]);

        $code = 'BH-' . date('Ym') . '-' . str_pad(DamageReport::count() + 1, 4, '0', STR_PAD_LEFT);
        $equipment = Equipment::findOrFail($validated['equipment_id']);

        $report = DamageReport::create([
            'code'            => $code,
            'equipment_id'    => $equipment->id,
            'reported_by'     => auth()->id(),
            'organization_id' => $equipment->organization_id,
            'detected_at'     => $validated['detected_at'],
            'description'     => $validated['description'],
            'priority'        => $validated['priority'],
            'status'          => 'NEW',
            'created_by'      => auth()->id(),
        ]);

        // Auto update equipment status to BROKEN or UNDER_REPAIR
        $equipment->update(['status' => EquipmentStatus::UNDER_REPAIR->value]);

        $this->auditLog->log('CREATE', 'damage_report', $report->id, null, $report->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Tạo phiếu báo hỏng thành công.',
            'data'    => $report->load(['equipment', 'organization']),
        ], 201);
    }

    public function show(DamageReport $damageReport): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $damageReport->load(['equipment', 'organization', 'reportedByUser']),
        ]);
    }
}
