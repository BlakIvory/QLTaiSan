<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProposalDocument;
use App\Models\PurchaseRequestSummary;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProposalDocumentController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = ProposalDocument::with(['summary.requests.organization', 'submittedBy', 'approvedBy', 'createdBy']);
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        return response()->json(['success' => true, 'data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'summary_id'    => 'required|exists:purchase_request_summaries,id',
            'title'         => 'required|string|max:255',
            'proposal_date' => 'required|date',
            'content'       => 'nullable|string',
            'justification' => 'nullable|string',
            'total_amount'  => 'nullable|numeric|min:0',
            'attachment'    => 'nullable|file|mimes:pdf,doc,docx|max:20480',
        ]);

        $summary = PurchaseRequestSummary::findOrFail($validated['summary_id']);
        if (!in_array($summary->status, ['FINALIZED', 'SUBMITTED_TO_BOARD'])) {
            return response()->json(['success' => false, 'message' => 'Bảng tổng hợp phải được hoàn thiện trước khi lập tờ trình.'], 422);
        }

        $data = collect($validated)->except('attachment')->all();
        $data['code']       = 'TT-' . now()->format('Ym') . '-' . str_pad(ProposalDocument::withTrashed()->count() + 1, 4, '0', STR_PAD_LEFT);
        $data['status']     = 'DRAFT';
        $data['created_by'] = auth()->id();

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $data['attachment_path'] = '/storage/' . $file->store('proposals', 'public');
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        $proposal = ProposalDocument::create($data);
        $this->auditLog->log('CREATE', 'proposal_document', $proposal->id, null, $proposal->toArray(), $request);
        return response()->json(['success' => true, 'message' => 'Đã lập tờ trình chủ trương.', 'data' => $proposal->load(['summary', 'createdBy'])], 201);
    }

    public function show(ProposalDocument $proposalDocument): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $proposalDocument->load(['summary.requests.organization', 'submittedBy', 'approvedBy', 'createdBy'])]);
    }

    public function update(Request $request, ProposalDocument $proposalDocument): JsonResponse
    {
        if ($proposalDocument->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ sửa được tờ trình ở trạng thái Nháp.'], 422);
        }

        $validated = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'proposal_date' => 'sometimes|date',
            'content'       => 'nullable|string',
            'justification' => 'nullable|string',
            'total_amount'  => 'nullable|numeric|min:0',
            'attachment'    => 'nullable|file|mimes:pdf,doc,docx|max:20480',
        ]);

        $data = collect($validated)->except('attachment')->all();
        if ($request->hasFile('attachment')) {
            if ($proposalDocument->attachment_path) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $proposalDocument->attachment_path));
            }
            $file = $request->file('attachment');
            $data['attachment_path'] = '/storage/' . $file->store('proposals', 'public');
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        $proposalDocument->update($data);
        return response()->json(['success' => true, 'message' => 'Đã cập nhật tờ trình.', 'data' => $proposalDocument->fresh(['summary'])]);
    }

    /** Trình lên BGĐ (DRAFT → SUBMITTED) */
    public function submit(Request $request, ProposalDocument $proposalDocument): JsonResponse
    {
        if ($proposalDocument->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Tờ trình phải ở trạng thái Nháp trước khi trình BGĐ.'], 422);
        }
        $proposalDocument->update([
            'status'       => 'SUBMITTED',
            'submitted_by' => auth()->id(),
            'submitted_at' => now(),
        ]);
        // Cập nhật trạng thái bảng tổng hợp
        $proposalDocument->summary->update(['status' => 'SUBMITTED_TO_BOARD']);
        $this->auditLog->log('SUBMIT', 'proposal_document', $proposalDocument->id, ['status' => 'DRAFT'], ['status' => 'SUBMITTED'], $request);
        return response()->json(['success' => true, 'message' => 'Đã trình tờ trình lên Ban giám đốc.', 'data' => $proposalDocument->fresh()]);
    }

    /** BGĐ phê duyệt (SUBMITTED → APPROVED) */
    public function approve(Request $request, ProposalDocument $proposalDocument): JsonResponse
    {
        if (!$request->user()->hasAnyRole(['leader', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Chỉ Ban Giám đốc hoặc Quản trị viên mới có quyền phê duyệt tờ trình.'], 403);
        }

        if ($proposalDocument->status !== 'SUBMITTED') {
            return response()->json(['success' => false, 'message' => 'Tờ trình phải ở trạng thái Đã trình mới có thể phê duyệt.'], 422);
        }
        $validated = $request->validate(['board_notes' => 'nullable|string']);
        $proposalDocument->update([
            'status'      => 'APPROVED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'board_notes' => $validated['board_notes'] ?? null,
        ]);
        $this->auditLog->log('APPROVE', 'proposal_document', $proposalDocument->id, ['status' => 'SUBMITTED'], ['status' => 'APPROVED'], $request);
        return response()->json(['success' => true, 'message' => 'Ban giám đốc đã phê duyệt tờ trình.', 'data' => $proposalDocument->fresh()]);
    }

    /** BGĐ từ chối (SUBMITTED → REJECTED) */
    public function reject(Request $request, ProposalDocument $proposalDocument): JsonResponse
    {
        if (!$request->user()->hasAnyRole(['leader', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Chỉ Ban Giám đốc hoặc Quản trị viên mới có quyền từ chối tờ trình.'], 403);
        }

        if ($proposalDocument->status !== 'SUBMITTED') {
            return response()->json(['success' => false, 'message' => 'Tờ trình phải ở trạng thái Đã trình mới có thể từ chối.'], 422);
        }
        $validated = $request->validate(['board_notes' => 'required|string']);
        $proposalDocument->update([
            'status'      => 'REJECTED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'board_notes' => $validated['board_notes'],
        ]);
        $this->auditLog->log('REJECT', 'proposal_document', $proposalDocument->id, ['status' => 'SUBMITTED'], ['status' => 'REJECTED'], $request);
        return response()->json(['success' => true, 'message' => 'Đã từ chối tờ trình.', 'data' => $proposalDocument->fresh()]);
    }

    public function destroy(ProposalDocument $proposalDocument): JsonResponse
    {
        if ($proposalDocument->status !== 'DRAFT') {
            return response()->json(['success' => false, 'message' => 'Chỉ xóa tờ trình ở trạng thái Nháp.'], 422);
        }
        if ($proposalDocument->attachment_path) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $proposalDocument->attachment_path));
        }
        $proposalDocument->delete();
        return response()->json(['success' => true, 'message' => 'Đã xóa tờ trình.']);
    }
}
