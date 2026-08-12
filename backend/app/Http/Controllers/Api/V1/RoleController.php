<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $roles,
        ]);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $permissions,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|unique:roles,name',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create([
            'name'       => $validated['name'],
            'guard_name' => 'sanctum',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo nhóm quyền thành công.',
            'data'    => $role->load('permissions'),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $role = Role::with('permissions')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $role,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name'          => 'sometimes|required|string|unique:roles,name,' . $id,
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if (!empty($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->input('permissions', []));
        }

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật nhóm quyền thành công.',
            'data'    => $role->fresh('permissions'),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa nhóm quyền Quản trị viên (admin).',
            ], 400);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa nhóm quyền thành công.',
        ]);
    }

    public function syncPermissions(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        $validated = $request->validate([
            'permissions'   => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions']);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật danh sách quyền cho nhóm thành công.',
            'data'    => $role->fresh('permissions'),
        ]);
    }
}
