<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EquipmentType;
use App\Models\EquipmentGroup;
use App\Models\Manufacturer;
use App\Models\Country;
use App\Models\FundingSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // ─── Equipment Groups ───────────────────────────────────────────────
    public function indexGroups(): JsonResponse
    {
        $groups = EquipmentGroup::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data'    => $groups,
        ]);
    }

    public function storeGroup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:equipment_groups,code',
            'name' => 'required|string|max:255',
        ]);
        $validated['is_active'] = true;
        $group = EquipmentGroup::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo nhóm thiết bị thành công.',
            'data'    => $group,
        ], 201);
    }

    public function updateGroup(Request $request, $id): JsonResponse
    {
        $group = EquipmentGroup::findOrFail($id);
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:equipment_groups,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'is_active' => 'boolean',
        ]);
        $group->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật nhóm thiết bị thành công.',
            'data'    => $group,
        ]);
    }

    // ─── Equipment Types ────────────────────────────────────────────────
    public function indexTypes(Request $request): JsonResponse
    {
        $query = EquipmentType::with('equipmentGroup');

        if ($groupId = $request->input('equipment_group_id')) {
            $query->where('equipment_group_id', $groupId);
        }

        $types = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $types,
        ]);
    }

    public function storeType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'                   => 'required|string|unique:equipment_types,code',
            'name'                   => 'required|string|max:255',
            'equipment_group_id'     => 'required|exists:equipment_groups,id',
            'maintenance_cycle_days' => 'nullable|integer',
            'inspection_cycle_days'  => 'nullable|integer',
        ], [
            'equipment_group_id.required' => 'Vui lòng chọn nhóm thiết bị.',
            'equipment_group_id.exists' => 'Nhóm thiết bị đã chọn không tồn tại.',
        ]);
        $validated['is_active'] = true;
        $validated['requires_maintenance'] = !empty($validated['maintenance_cycle_days']);
        $validated['requires_inspection']  = !empty($validated['inspection_cycle_days']);

        $type = EquipmentType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo loại thiết bị thành công.',
            'data'    => $type->load('equipmentGroup'),
        ], 201);
    }

    public function updateType(Request $request, $id): JsonResponse
    {
        $type = EquipmentType::findOrFail($id);
        $validated = $request->validate([
            'code'                   => 'sometimes|string|unique:equipment_types,code,' . $id,
            'name'                   => 'sometimes|string|max:255',
            'equipment_group_id'     => 'sometimes|required|exists:equipment_groups,id',
            'maintenance_cycle_days' => 'nullable|integer',
            'inspection_cycle_days'  => 'nullable|integer',
            'is_active'              => 'boolean',
        ]);
        $type->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật loại thiết bị thành công.',
            'data'    => $type->fresh('equipmentGroup'),
        ]);
    }

    // ─── Manufacturers ──────────────────────────────────────────────────
    public function indexManufacturers(): JsonResponse
    {
        $manufacturers = Manufacturer::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data'    => $manufacturers,
        ]);
    }

    public function storeManufacturer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:manufacturers,code',
            'name' => 'required|string|max:255',
        ]);
        $validated['is_active'] = true;
        $mfr = Manufacturer::create($validated);

        return response()->json([
            'success' => true,
            'data'    => $mfr,
        ], 201);
    }

    public function updateManufacturer(Request $request, $id): JsonResponse
    {
        $mfr = Manufacturer::findOrFail($id);
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:manufacturers,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'is_active' => 'boolean',
        ]);
        $mfr->update($validated);

        return response()->json([
            'success' => true,
            'data'    => $mfr,
        ]);
    }

    // ─── Countries ──────────────────────────────────────────────────────
    public function indexCountries(): JsonResponse
    {
        $countries = Country::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data'    => $countries,
        ]);
    }

    public function storeCountry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:countries,code',
            'name' => 'required|string|max:255',
        ]);
        $validated['is_active'] = true;
        $country = Country::create($validated);

        return response()->json([
            'success' => true,
            'data'    => $country,
        ], 201);
    }

    // ─── Funding Sources ────────────────────────────────────────────────
    public function indexFundingSources(): JsonResponse
    {
        $sources = FundingSource::orderBy('name')->get();
        return response()->json([
            'success' => true,
            'data'    => $sources,
        ]);
    }

    public function storeFundingSource(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:funding_sources,code',
            'name' => 'required|string|max:255',
        ]);
        $validated['is_active'] = true;
        $source = FundingSource::create($validated);

        return response()->json([
            'success' => true,
            'data'    => $source,
        ], 201);
    }
}
