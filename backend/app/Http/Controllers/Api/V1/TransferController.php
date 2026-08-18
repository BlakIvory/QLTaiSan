<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EquipmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Transfer;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}
    private array $relations = ['equipment', 'fromOrganization', 'toOrganization', 'fromLocation', 'toLocation', 'requester', 'approver'];

    public function index(Request $request): JsonResponse
    {
        $query = Transfer::with($this->relations);
        if ($search = $request->input('search')) $query->where(fn ($q) => $q->where('code', 'like', "%{$search}%")->orWhereHas('equipment', fn ($e) => $e->where('name', 'like', "%{$search}%")->orWhere('equipment_code', 'like', "%{$search}%")));
        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['equipment_id' => 'required|exists:equipment,id', 'to_organization_id' => 'required|exists:organizations,id', 'to_location_id' => 'nullable|exists:locations,id', 'reason' => 'required|string', 'requested_date' => 'required|date', 'notes' => 'nullable|string']);
        $equipment = Equipment::findOrFail($validated['equipment_id']);
        if ((int) $equipment->organization_id === (int) $validated['to_organization_id']) return $this->invalidState('Bộ phận đích phải khác bộ phận hiện tại.');
        if (Transfer::where('equipment_id', $equipment->id)->whereIn('status', ['PENDING', 'APPROVED', 'DELIVERED'])->exists()) return $this->invalidState('Thiết bị đang có một phiếu điều chuyển chưa hoàn tất.');
        $transfer = Transfer::create([
            'code' => 'DC-' . now()->format('Ym') . '-' . str_pad(Transfer::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT),
            'equipment_id' => $equipment->id, 'from_organization_id' => $equipment->organization_id, 'to_organization_id' => $validated['to_organization_id'],
            'from_location_id' => $equipment->location_id, 'to_location_id' => $validated['to_location_id'] ?? null, 'reason' => $validated['reason'],
            'requested_by' => auth()->id(), 'requested_date' => $validated['requested_date'], 'notes' => $validated['notes'] ?? null, 'status' => 'PENDING', 'created_by' => auth()->id(),
        ]);
        $this->auditLog->log('CREATE', 'transfer', $transfer->id, null, $transfer->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã tạo yêu cầu điều chuyển, tài sản chưa thay đổi bộ phận.', 'data' => $transfer->load($this->relations)], 201);
    }

    public function show(Transfer $transfer): JsonResponse { return response()->json(['success' => true, 'data' => $transfer->load($this->relations)]); }

    public function approve(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status !== 'PENDING') return $this->invalidState('Chỉ phiếu chờ duyệt mới được phê duyệt.');
        $transfer->update(['status' => 'APPROVED', 'approved_by' => auth()->id(), 'approved_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Đã phê duyệt điều chuyển.', 'data' => $transfer->fresh($this->relations)]);
    }

    public function reject(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status !== 'PENDING') return $this->invalidState('Chỉ phiếu chờ duyệt mới được từ chối.');
        $validated = $request->validate(['notes' => 'required|string']);
        $transfer->update(['status' => 'REJECTED', 'approved_by' => auth()->id(), 'approved_at' => now(), 'notes' => $validated['notes']]);
        return response()->json(['success' => true, 'message' => 'Đã từ chối điều chuyển.', 'data' => $transfer->fresh($this->relations)]);
    }

    public function handover(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status !== 'APPROVED') return $this->invalidState('Phiếu phải được duyệt trước khi bàn giao.');
        $transfer->update(['status' => 'DELIVERED', 'issued_by' => auth()->id(), 'executed_date' => now()->toDateString()]);
        return response()->json(['success' => true, 'message' => 'Đã ghi nhận bên giao bàn giao tài sản.', 'data' => $transfer->fresh($this->relations)]);
    }

    public function complete(Request $request, Transfer $transfer): JsonResponse
    {
        if ($transfer->status !== 'DELIVERED') return $this->invalidState('Tài sản phải được bàn giao trước khi bên nhận xác nhận.');
        DB::transaction(function () use ($transfer) {
            $transfer->equipment->update(['organization_id' => $transfer->to_organization_id, 'location_id' => $transfer->to_location_id, 'status' => EquipmentStatus::IN_USE->value]);
            $transfer->update(['status' => 'COMPLETED', 'received_by' => auth()->id(), 'executed_date' => now()->toDateString()]);
        });
        $this->auditLog->log('COMPLETE', 'transfer', $transfer->id, ['organization_id' => $transfer->from_organization_id], ['organization_id' => $transfer->to_organization_id], $request);
        return response()->json(['success' => true, 'message' => 'Đã hoàn tất điều chuyển và cập nhật bộ phận quản lý.', 'data' => $transfer->fresh($this->relations)]);
    }

    public function destroy(Transfer $transfer): JsonResponse
    {
        if ($transfer->status !== 'PENDING') return $this->invalidState('Chỉ được xóa phiếu đang chờ duyệt.');
        $transfer->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa phiếu điều chuyển.']);
    }

    private function invalidState(string $message): JsonResponse { return response()->json(['success' => false, 'message' => $message], 422); }
}
