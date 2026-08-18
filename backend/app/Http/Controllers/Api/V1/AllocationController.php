<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EquipmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\AllocationItem;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AllocationController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = Allocation::with(['items.equipment', 'fromOrganization', 'toOrganization', 'issuer', 'receiver']);
        if ($search = $request->input('search')) $query->where('code', 'like', "%{$search}%");
        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_organization_id' => 'required|exists:organizations,id',
            'to_organization_id' => 'required|different:from_organization_id|exists:organizations,id',
            'allocation_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.equipment_id' => 'required|distinct|exists:equipment,id',
            'items.*.condition_at_handover' => 'nullable|string|max:255',
        ]);
        $allocation = DB::transaction(function () use ($validated) {
            $allocation = Allocation::create([
                'code' => 'CP-' . now()->format('Ym') . '-' . str_pad(Allocation::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT),
                'from_organization_id' => $validated['from_organization_id'], 'to_organization_id' => $validated['to_organization_id'],
                'allocation_date' => $validated['allocation_date'], 'notes' => $validated['notes'] ?? null,
                'status' => 'PENDING', 'created_by' => auth()->id(),
            ]);
            foreach ($validated['items'] as $item) AllocationItem::create(['allocation_id' => $allocation->id] + $item);
            return $allocation;
        });
        $this->auditLog->log('CREATE', 'allocation', $allocation->id, null, $allocation->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã tạo phiếu cấp phát.', 'data' => $allocation->load(['items.equipment', 'fromOrganization', 'toOrganization'])], 201);
    }

    public function show(Allocation $allocation): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $allocation->load(['items.equipment', 'fromOrganization', 'toOrganization'])]);
    }

    public function confirm(Request $request, Allocation $allocation): JsonResponse
    {
        if ($allocation->status !== 'PENDING') return response()->json(['success' => false, 'message' => 'Phiếu không ở trạng thái chờ xác nhận.'], 422);
        foreach ($allocation->items as $item) {
            $status = $item->equipment->status instanceof EquipmentStatus ? $item->equipment->status->value : $item->equipment->status;
            if ($item->equipment->organization_id !== $allocation->from_organization_id || $status !== EquipmentStatus::IN_STOCK->value) {
                return response()->json(['success' => false, 'message' => "Thiết bị {$item->equipment->equipment_code} không còn trong kho nguồn."], 422);
            }
        }
        $allocation->update(['status' => 'CONFIRMED', 'issued_by' => auth()->id()]);
        return response()->json(['success' => true, 'message' => 'Đã xác nhận phiếu cấp phát.', 'data' => $allocation->fresh(['items.equipment', 'fromOrganization', 'toOrganization'])]);
    }

    public function handover(Request $request, Allocation $allocation): JsonResponse
    {
        if ($allocation->status !== 'CONFIRMED') return response()->json(['success' => false, 'message' => 'Phiếu phải được xác nhận trước khi bàn giao.'], 422);
        $validated = $request->validate(['received_by' => 'nullable|exists:users,id']);
        DB::transaction(function () use ($allocation, $validated) {
            foreach ($allocation->items as $item) $item->equipment->update(['organization_id' => $allocation->to_organization_id, 'location_id' => null, 'status' => EquipmentStatus::IN_USE->value, 'in_use_date' => now()->toDateString()]);
            $allocation->update(['status' => 'COMPLETED', 'received_by' => $validated['received_by'] ?? auth()->id()]);
        });
        return response()->json(['success' => true, 'message' => 'Đã bàn giao tài sản cho bộ phận sử dụng.', 'data' => $allocation->fresh(['items.equipment', 'fromOrganization', 'toOrganization'])]);
    }

    public function destroy(Allocation $allocation): JsonResponse
    {
        if ($allocation->status !== 'PENDING') return response()->json(['success' => false, 'message' => 'Chỉ được xóa phiếu đang chờ.'], 422);
        $allocation->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa phiếu cấp phát.']);
    }
}
