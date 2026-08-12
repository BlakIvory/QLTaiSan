<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\Equipment;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransferController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = Transfer::with(['equipment', 'fromOrganization', 'toOrganization']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function ($eqQ) use ($search) {
                      $eqQ->where('name', 'like', "%{$search}%")
                          ->orWhere('equipment_code', 'like', "%{$search}%");
                  });
            });
        }

        $transfers = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $transfers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id'       => 'required|exists:equipment,id',
            'to_organization_id' => 'required|exists:organizations,id',
            'reason'             => 'required|string',
            'requested_date'     => 'required|date',
        ]);

        $code = 'DC-' . date('Ym') . '-' . str_pad(Transfer::count() + 1, 4, '0', STR_PAD_LEFT);
        $equipment = Equipment::findOrFail($validated['equipment_id']);

        $transfer = Transfer::create([
            'code'                 => $code,
            'equipment_id'         => $equipment->id,
            'from_organization_id' => $equipment->organization_id,
            'to_organization_id'   => $validated['to_organization_id'],
            'reason'               => $validated['reason'],
            'requested_by'         => auth()->id(),
            'requested_date'       => $validated['requested_date'],
            'status'               => 'PENDING',
            'created_by'           => auth()->id(),
        ]);

        // Transfer organization of equipment immediately or after approval
        $equipment->update(['organization_id' => $validated['to_organization_id']]);

        $this->auditLog->log('CREATE', 'transfer', $transfer->id, null, $transfer->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Tạo phiếu điều chuyển thành công.',
            'data'    => $transfer->load(['equipment', 'fromOrganization', 'toOrganization']),
        ], 201);
    }
}
