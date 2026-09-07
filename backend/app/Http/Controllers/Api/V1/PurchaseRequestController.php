<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseRequestController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = PurchaseRequest::with(['requester', 'organization', 'summary']);

        if ($search = $request->input('search')) {
            $query->where(fn($q) => $q->where('item_name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%"));
        }
        if ($orgId = $request->input('organization_id')) {
            $query->where('organization_id', $orgId);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'organization_id'  => 'required|exists:organizations,id',
            'item_name'        => 'required|string|max:255',
            'category'         => 'nullable|string|max:100',
            'quantity'         => 'required|integer|min:1',
            'unit'             => 'nullable|string|max:50',
            'estimated_price'  => 'nullable|numeric|min:0',
            'reason'           => 'required|string',
            'specifications'   => 'nullable|string',
            'priority'         => 'nullable|in:LOW,NORMAL,HIGH,URGENT',
            'needed_by'        => 'nullable|date',
        ]);

        $user = $request->user();
        if ($user && !$user->hasRole('admin') && $user->organization_id) {
            $allowedOrgIds = \App\Models\Organization::where('id', $user->organization_id)
                ->orWhere('parent_id', $user->organization_id)
                ->pluck('id')
                ->toArray();

            if (!in_array((int)$validated['organization_id'], $allowedOrgIds, true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn chỉ được lập đề nghị cho khoa/phòng thuộc tài khoản của bạn.',
                ], 403);
            }
        }

        $validated['code']       = 'DM-' . now()->format('Ym') . '-' . str_pad(PurchaseRequest::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
        $validated['status']     = 'DRAFT';
        $validated['requester_id'] = auth()->id();
        $validated['created_by'] = auth()->id();
        if (!empty($validated['estimated_price']) && !empty($validated['quantity'])) {
            $validated['estimated_total'] = $validated['estimated_price'] * $validated['quantity'];
        }

        $req = PurchaseRequest::create($validated);
        $this->auditLog->log('CREATE', 'purchase_request', $req->id, null, $req->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã tạo đề nghị mua tài sản.', 'data' => $req->load(['requester', 'organization'])], 201);
    }

    public function show(PurchaseRequest $purchaseRequest): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $purchaseRequest->load(['requester', 'organization', 'summary'])]);
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        if (!in_array($purchaseRequest->status, ['DRAFT'])) {
            return response()->json(['success' => false, 'message' => 'Chỉ được sửa đề nghị ở trạng thái Nháp.'], 422);
        }

        $validated = $request->validate([
            'item_name'       => 'sometimes|string|max:255',
            'category'        => 'nullable|string|max:100',
            'quantity'        => 'sometimes|integer|min:1',
            'unit'            => 'nullable|string|max:50',
            'estimated_price' => 'nullable|numeric|min:0',
            'reason'          => 'sometimes|string',
            'specifications'  => 'nullable|string',
            'priority'        => 'nullable|in:LOW,NORMAL,HIGH,URGENT',
            'needed_by'       => 'nullable|date',
        ]);

        if (isset($validated['estimated_price']) && isset($validated['quantity'])) {
            $validated['estimated_total'] = $validated['estimated_price'] * $validated['quantity'];
        }

        $oldData = $purchaseRequest->toArray();
        $purchaseRequest->update($validated);
        $this->auditLog->log('UPDATE', 'purchase_request', $purchaseRequest->id, $oldData, $purchaseRequest->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã cập nhật đề nghị mua.', 'data' => $purchaseRequest->fresh(['requester', 'organization'])]);
    }

    public function destroy(PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequest->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ được xóa đề nghị ở trạng thái Nháp.'], 422);
        }
        $purchaseRequest->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa đề nghị mua.']);
    }

    /** Gửi đề nghị lên (DRAFT → SUBMITTED) */
    public function submit(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequest->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ đề nghị ở trạng thái Nháp mới được gửi.'], 422);
        }
        $purchaseRequest->update(['status' => 'SUBMITTED']);
        $this->auditLog->log('SUBMIT', 'purchase_request', $purchaseRequest->id, ['status' => 'DRAFT'], ['status' => 'SUBMITTED'], $request);
        return response()->json(['success' => true, 'message' => 'Đã gửi đề nghị mua tài sản.', 'data' => $purchaseRequest->fresh()]);
    }

    /** Rút lại đề nghị (SUBMITTED → DRAFT) */
    public function recall(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequest->status !== 'SUBMITTED') {
            return response()->json(['success' => false, 'message' => 'Chỉ rút lại đề nghị đang chờ tổng hợp.'], 422);
        }
        $purchaseRequest->update(['status' => 'DRAFT']);
        return response()->json(['success' => true, 'message' => 'Đã rút lại đề nghị mua.', 'data' => $purchaseRequest->fresh()]);
    }
}
