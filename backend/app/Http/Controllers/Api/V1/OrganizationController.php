<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function __construct(private AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $query = Organization::with('parent');

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($request->has('min_level')) {
            $query->where('level', '>=', (int) $request->input('min_level'));
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $organizations = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $organizations,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'        => 'required|string|unique:organizations,code',
            'name'        => 'required|string|max:255',
            'type'        => 'required|string',
            'parent_id'   => 'nullable|exists:organizations,id',
            'phone'       => 'nullable|string',
            'address'     => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $org = Organization::create($validated);
        $this->auditLog->log('CREATE', 'organization', $org->id, null, $org->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Tạo khoa/phòng thành công.',
            'data'    => $org,
        ], 201);
    }

    public function show(Organization $organization): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $organization->load(['parent', 'children', 'locations', 'users']),
        ]);
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        $old = $organization->toArray();
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'type'        => 'sometimes|string',
            'parent_id'   => 'nullable|exists:organizations,id',
            'phone'       => 'nullable|string',
            'address'     => 'nullable|string',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $organization->update($validated);
        $this->auditLog->log('UPDATE', 'organization', $organization->id, $old, $organization->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật khoa/phòng thành công.',
            'data'    => $organization,
        ]);
    }

    public function destroy(Organization $organization, Request $request): JsonResponse
    {
        // Check child organizations
        if ($organization->children()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa đơn vị này vì đang có các đơn vị/phòng ban con trực thuộc.',
            ], 422);
        }

        // Check equipment linked to this organization
        if ($organization->equipment()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa đơn vị này vì đang chứa ' . $organization->equipment()->count() . ' thiết bị trong hệ thống.',
            ], 422);
        }

        $old = $organization->toArray();
        $organization->delete();
        $this->auditLog->log('DELETE', 'organization', $organization->id, $old, null, $request);

        return response()->json([
            'success' => true,
            'message' => 'Xóa khoa/phòng thành công.',
        ]);
    }

    public function toggleActive(Organization $organization, Request $request): JsonResponse
    {
        $old = $organization->toArray();
        $organization->is_active = !$organization->is_active;
        $organization->save();

        $this->auditLog->log('UPDATE_STATUS', 'organization', $organization->id, $old, $organization->toArray(), $request);

        return response()->json([
            'success' => true,
            'message' => $organization->is_active ? 'Đã kích hoạt khoa/phòng.' : 'Đã khóa khoa/phòng.',
            'data'    => $organization,
        ]);
    }

    public function tree(): JsonResponse
    {
        $rootNodes = Organization::whereNull('parent_id')->with('children.children')->get();

        return response()->json([
            'success' => true,
            'data'    => $rootNodes,
        ]);
    }
}
