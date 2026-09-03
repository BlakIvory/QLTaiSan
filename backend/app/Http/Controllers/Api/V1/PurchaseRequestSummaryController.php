<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestSummary;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseRequestSummaryController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = PurchaseRequestSummary::with(['requests.organization', 'createdBy']);
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'period'       => 'nullable|string|max:50',
            'summary_date' => 'required|date',
            'request_ids'  => 'required|array|min:1',
            'request_ids.*'=> 'exists:purchase_requests,id',
            'notes'        => 'nullable|string',
        ]);

        $requests = PurchaseRequest::whereIn('id', $validated['request_ids'])->where('status', 'SUBMITTED')->get();
        if ($requests->count() !== count($validated['request_ids'])) {
            return response()->json(['success' => false, 'message' => 'Một số đề nghị không hợp lệ hoặc chưa được gửi.'], 422);
        }

        $summary = DB::transaction(function () use ($validated, $requests) {
            $totalEstimated = $requests->sum('estimated_total');
            $summary = PurchaseRequestSummary::create([
                'code'            => 'TH-' . now()->format('Ym') . '-' . str_pad(PurchaseRequestSummary::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT),
                'title'           => $validated['title'],
                'period'          => $validated['period'] ?? null,
                'summary_date'    => $validated['summary_date'],
                'total_estimated' => $totalEstimated,
                'notes'           => $validated['notes'] ?? null,
                'status'          => 'DRAFT',
                'created_by'      => auth()->id(),
            ]);
            // Gán các đề nghị vào bảng tổng hợp
            $requests->each(fn($r) => $r->update(['summary_id' => $summary->id, 'status' => 'CONSOLIDATED']));
            return $summary;
        });

        $this->auditLog->log('CREATE', 'purchase_request_summary', $summary->id, null, $summary->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã lập bảng tổng hợp đề nghị mua.', 'data' => $summary->load(['requests.organization', 'createdBy'])], 201);
    }

    public function show(PurchaseRequestSummary $purchaseRequestSummary): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $purchaseRequestSummary->load(['requests.organization', 'requests.requester', 'createdBy', 'proposals'])]);
    }

    public function update(Request $request, PurchaseRequestSummary $purchaseRequestSummary): JsonResponse
    {
        if ($purchaseRequestSummary->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ sửa được bảng tổng hợp ở trạng thái Nháp.'], 422);
        }

        $validated = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'period'       => 'nullable|string|max:50',
            'summary_date' => 'sometimes|date',
            'notes'        => 'nullable|string',
        ]);

        $purchaseRequestSummary->update($validated);
        return response()->json(['success' => true, 'message' => 'Đã cập nhật bảng tổng hợp.', 'data' => $purchaseRequestSummary->fresh()]);
    }

    /** Thêm đề nghị vào bảng tổng hợp */
    public function addRequests(Request $request, PurchaseRequestSummary $purchaseRequestSummary): JsonResponse
    {
        if ($purchaseRequestSummary->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ thêm đề nghị vào bảng ở trạng thái Nháp.'], 422);
        }
        $validated = $request->validate(['request_ids' => 'required|array|min:1', 'request_ids.*' => 'exists:purchase_requests,id']);
        $requests = PurchaseRequest::whereIn('id', $validated['request_ids'])->where('status', 'SUBMITTED')->get();
        DB::transaction(function () use ($purchaseRequestSummary, $requests) {
            $requests->each(fn($r) => $r->update(['summary_id' => $purchaseRequestSummary->id, 'status' => 'CONSOLIDATED']));
            $total = $purchaseRequestSummary->requests()->sum('estimated_total');
            $purchaseRequestSummary->update(['total_estimated' => $total]);
        });
        return response()->json(['success' => true, 'message' => 'Đã thêm đề nghị vào bảng tổng hợp.', 'data' => $purchaseRequestSummary->fresh(['requests.organization'])]);
    }

    /** Xóa đề nghị khỏi bảng tổng hợp */
    public function removeRequest(Request $request, PurchaseRequestSummary $purchaseRequestSummary, PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequestSummary->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ xóa đề nghị khỏi bảng ở trạng thái Nháp.'], 422);
        }
        $purchaseRequest->update(['summary_id' => null, 'status' => 'SUBMITTED']);
        $total = $purchaseRequestSummary->requests()->sum('estimated_total');
        $purchaseRequestSummary->update(['total_estimated' => $total]);
        return response()->json(['success' => true, 'message' => 'Đã gỡ đề nghị khỏi bảng tổng hợp.']);
    }

    /** Hoàn thiện bảng tổng hợp (DRAFT → FINALIZED) */
    public function finalize(Request $request, PurchaseRequestSummary $purchaseRequestSummary): JsonResponse
    {
        if ($purchaseRequestSummary->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Bảng tổng hợp phải ở trạng thái Nháp.'], 422);
        }
        if ($purchaseRequestSummary->requests()->count() === 0) {
            return response()->json(['success' => false, 'message' => 'Bảng tổng hợp chưa có đề nghị nào.'], 422);
        }
        $purchaseRequestSummary->update(['status' => 'FINALIZED']);
        return response()->json(['success' => true, 'message' => 'Đã hoàn thiện bảng tổng hợp đề nghị mua.', 'data' => $purchaseRequestSummary->fresh()]);
    }

    public function destroy(PurchaseRequestSummary $purchaseRequestSummary): JsonResponse
    {
        if ($purchaseRequestSummary->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ xóa được bảng tổng hợp ở trạng thái Nháp.'], 422);
        }
        // Trả lại trạng thái SUBMITTED cho các đề nghị
        $purchaseRequestSummary->requests()->update(['summary_id' => null, 'status' => 'SUBMITTED']);
        $purchaseRequestSummary->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa bảng tổng hợp.']);
    }
}
