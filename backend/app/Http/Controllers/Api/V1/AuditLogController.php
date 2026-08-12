<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($search = $request->input('search')) {
            $query->where('action', 'like', "%{$search}%")
                  ->orWhere('module', 'like', "%{$search}%");
        }

        $logs = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }
}
