<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\EquipmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceiptController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = Receipt::with(['items.equipment', 'supplier', 'organization', 'creator']);
        if ($search = $request->input('search')) {
            $query->where(fn ($q) => $q->where('code', 'like', "%{$search}%")
                ->orWhere('invoice_number', 'like', "%{$search}%")
                ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%")));
        }
        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'contract_number' => 'nullable|string|max:100',
            'invoice_number' => 'required|string|max:100',
            'invoice_date' => 'required|date',
            'receipt_date' => 'required|date',
            'organization_id' => 'required|exists:organizations,id',
            'total_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'items' => 'required|array|min:1',
            'items.*.equipment_id' => 'required|distinct|exists:equipment,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.condition_note' => 'nullable|string|max:255',
            'items.*.notes' => 'nullable|string',
        ]);

        $receipt = DB::transaction(function () use ($validated, $request) {
            $data = collect($validated)->except(['items', 'attachment'])->all();
            $data['code'] = 'PN-' . now()->format('Ymd') . '-' . str_pad(Receipt::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
            $data['status'] = 'DRAFT';
            $data['created_by'] = auth()->id();
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $data['attachment_path'] = '/storage/' . $file->store('receipts', 'public');
                $data['attachment_name'] = $file->getClientOriginalName();
            }
            $receipt = Receipt::create($data);
            foreach ($validated['items'] as $item) ReceiptItem::create(['receipt_id' => $receipt->id] + $item);
            return $receipt;
        });

        $this->auditLog->log('CREATE', 'receipt', $receipt->id, null, $receipt->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã tạo phiếu nhập tài sản.', 'data' => $receipt->load(['items.equipment', 'supplier', 'organization'])], 201);
    }

    public function show(Receipt $receipt): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $receipt->load(['items.equipment', 'supplier', 'organization', 'creator'])]);
    }

    public function update(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ phiếu nháp mới được chỉnh sửa.'], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'contract_number' => 'nullable|string|max:100',
            'invoice_number' => 'required|string|max:100',
            'invoice_date' => 'required|date',
            'receipt_date' => 'required|date',
            'organization_id' => 'required|exists:organizations,id',
            'total_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'items' => 'required|array|min:1',
            'items.*.equipment_id' => 'required|distinct|exists:equipment,id',
            'items.*.quantity' => 'nullable|integer|min:1',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.condition_note' => 'nullable|string|max:255',
            'items.*.notes' => 'nullable|string',
        ]);

        $oldData = $receipt->load('items')->toArray();
        DB::transaction(function () use ($receipt, $validated, $request) {
            $data = collect($validated)->except(['items', 'attachment'])->all();
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $data['attachment_path'] = '/storage/' . $file->store('receipts', 'public');
                $data['attachment_name'] = $file->getClientOriginalName();
            }
            $receipt->update($data);
            $receipt->items()->delete();
            foreach ($validated['items'] as $item) ReceiptItem::create(['receipt_id' => $receipt->id] + $item);
        });
        $this->auditLog->log('UPDATE', 'receipt', $receipt->id, $oldData, $receipt->fresh('items')->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã cập nhật phiếu nhập.', 'data' => $receipt->fresh(['items.equipment', 'supplier', 'organization'])]);
    }

    public function confirm(Request $request, Receipt $receipt): JsonResponse
    {
        if ($receipt->status !== 'DRAFT') return response()->json(['success' => false, 'message' => 'Chỉ phiếu nháp mới được xác nhận nhập kho.'], 422);
        DB::transaction(function () use ($receipt) {
            foreach ($receipt->items as $item) {
                $item->equipment->update(['organization_id' => $receipt->organization_id, 'location_id' => null, 'status' => EquipmentStatus::IN_STOCK->value]);
            }
            $receipt->update(['status' => 'CONFIRMED', 'received_by' => auth()->id()]);
        });
        $this->auditLog->log('CONFIRM', 'receipt', $receipt->id, ['status' => 'DRAFT'], ['status' => 'CONFIRMED'], $request);
        return response()->json(['success' => true, 'message' => 'Đã xác nhận nhập kho.', 'data' => $receipt->fresh(['items.equipment', 'supplier', 'organization'])]);
    }

    public function uploadAttachment(Request $request, Receipt $receipt): JsonResponse
    {
        $request->validate(['attachment' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240']);
        $file = $request->file('attachment');
        $receipt->update(['attachment_path' => '/storage/' . $file->store('receipts', 'public'), 'attachment_name' => $file->getClientOriginalName()]);
        return response()->json(['success' => true, 'message' => 'Đã tải chứng từ.', 'data' => $receipt]);
    }

    public function destroy(Receipt $receipt): JsonResponse
    {
        if ($receipt->status !== 'DRAFT') return response()->json(['success' => false, 'message' => 'Không thể xóa phiếu đã nhập kho.'], 422);
        $receipt->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa phiếu nhập.']);
    }
}
