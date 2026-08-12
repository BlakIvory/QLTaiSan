<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['organization', 'roles']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        if ($orgId = $request->input('organization_id')) {
            $query->where('organization_id', $orgId);
        }

        $users = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|string|min:6',
            'phone'           => 'nullable|string|max:20',
            'employee_code'   => 'nullable|string|unique:users,employee_code',
            'organization_id' => 'nullable|exists:organizations,id',
            'roles'           => 'nullable|array',
            'roles.*'         => 'string|exists:roles,name',
        ]);

        $roles = $validated['roles'] ?? ['department_staff'];
        unset($validated['roles']);

        $validated['is_active'] = true;

        $user = User::create($validated);
        $user->syncRoles($roles);

        return response()->json([
            'success' => true,
            'message' => 'Tạo người dùng thành công.',
            'data'    => $user->load(['organization', 'roles']),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $user = User::with(['organization', 'roles', 'permissions'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'            => 'sometimes|required|string|max:255',
            'email'           => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($user->id)],
            'password'        => 'nullable|string|min:6',
            'phone'           => 'nullable|string|max:20',
            'employee_code'   => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
            'organization_id' => 'nullable|exists:organizations,id',
            'is_active'       => 'boolean',
            'roles'           => 'nullable|array',
            'roles.*'         => 'string|exists:roles,name',
        ]);

        $roles = $validated['roles'] ?? null;
        unset($validated['roles']);

        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        if ($roles !== null) {
            $user->syncRoles($roles);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật người dùng thành công.',
            'data'    => $user->fresh(['organization', 'roles']),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        if ($request->user()->id == $id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không thể tự xóa tài khoản của chính mình.',
            ], 400);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa người dùng thành công.',
        ]);
    }

    public function lock($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Đã khóa tài khoản thành công.',
            'data'    => $user,
        ]);
    }

    public function unlock($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Đã mở khóa tài khoản thành công.',
            'data'    => $user,
        ]);
    }

    public function syncRoles(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'roles'   => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $user->syncRoles($validated['roles']);

        return response()->json([
            'success' => true,
            'message' => 'Gán nhóm quyền thành công.',
            'data'    => $user->fresh(['roles']),
        ]);
    }
}
