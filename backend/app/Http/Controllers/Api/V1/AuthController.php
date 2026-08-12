<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check account existence
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Email không tồn tại trong hệ thống.'],
            ]);
        }

        // Check locked
        if ($user->isLocked()) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'],
            ]);
        }

        // Check active
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản không hoạt động. Vui lòng liên hệ quản trị viên.'],
            ]);
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            $user->increment('failed_login_count');

            // Lock after 5 failed attempts
            if ($user->failed_login_count >= 5) {
                $user->update(['locked_at' => now()]);
                throw ValidationException::withMessages([
                    'email' => ['Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần.'],
                ]);
            }

            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không chính xác.'],
            ]);
        }

        // Reset failed login count and update last_login_at
        $user->update([
            'failed_login_count' => 0,
            'last_login_at'      => now(),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        $this->auditLog->log('LOGIN', 'auth', $user->id, null, null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công.',
            'data'    => [
                'token' => $token,
                'user'  => $this->userResource($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auditLog->log('LOGOUT', 'auth', $request->user()->id, null, null, $request);
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('organization');

        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin thành công.',
            'data'    => $this->userResource($user),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không chính xác.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        $this->auditLog->log('CHANGE_PASSWORD', 'auth', $user->id, null, null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công.',
        ]);
    }

    private function userResource(User $user): array
    {
        return [
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'phone'           => $user->phone,
            'employee_code'   => $user->employee_code,
            'avatar'          => $user->avatar,
            'is_active'       => $user->is_active,
            'last_login_at'   => $user->last_login_at?->toIso8601String(),
            'organization'    => $user->organization ? [
                'id'   => $user->organization->id,
                'name' => $user->organization->name,
                'type' => $user->organization->type,
            ] : null,
            'roles'           => $user->getRoleNames(),
            'permissions'     => $user->getAllPermissions()->pluck('name'),
            'created_at'      => $user->created_at->toIso8601String(),
        ];
    }
}
