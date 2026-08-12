<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Repair;
use App\Models\Equipment;
use App\Enums\EquipmentStatus;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepairController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = Repair::with(['equipment', 'technician']);

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

        $repairs = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $repairs,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipment,id',
            'repair_unit'  => 'nullable|string',
            'parts_cost'   => 'nullable|numeric|min:0',
            'labor_cost'   => 'nullable|numeric|min:0',
            'total_cost'   => 'nullable|numeric|min:0',
        ]);

        $code = 'SC-' . date('Ym') . '-' . str_pad(Repair::count() + 1, 4, '0', STR_PAD_LEFT);
        $equipment = Equipment::findOrFail($validated['equipment_id']);

        $repair = Repair::create([
            'code'         => $code,
            'equipment_id' => $equipment->id,
            'repair_unit'  => $validated['repair_unit'] ?? 'Nội bộ',
            'start_date'   => now()->toDateString(),
            'parts_cost'   => $validated['parts_cost'] ?? 0,
            'labor_cost'   => $validated['labor_cost'] ?? 0,
            'total_cost'   => $validated['total_cost'] ?? 0,
            'status'       => 'REPAIRING',
            'created_by'   => auth()->id(),
        ]);

        $equipment->update(['status' => EquipmentStatus::UNDER_REPAIR->value]);

        $this->auditLog->log('CREATE', 'repair', $repair->id, null, $repair->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Tạo phiếu sửa chữa thành công.',
            'data'    => $repair->load('equipment'),
        ], 201);
    }
}
