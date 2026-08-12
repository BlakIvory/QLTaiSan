<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogService
{
    public function log(
        string $action,
        string $module,
        ?int $recordId = null,
        ?array $oldData = null,
        ?array $newData = null,
        ?Request $request = null
    ): void {
        // Don't log passwords or tokens
        $sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'access_token'];

        if ($oldData) {
            $oldData = array_diff_key($oldData, array_flip($sensitiveKeys));
        }
        if ($newData) {
            $newData = array_diff_key($newData, array_flip($sensitiveKeys));
        }

        AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => $action,
            'module'     => $module,
            'record_id'  => $recordId,
            'old_data'   => $oldData ? json_encode($oldData) : null,
            'new_data'   => $newData ? json_encode($newData) : null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}
