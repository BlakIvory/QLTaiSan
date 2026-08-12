<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MaintenancePlan;
use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MaintenancePlan::with(['equipment.organization']);

        if ($search = $request->input('search')) {
            $query->whereHas('equipment', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('equipment_code', 'like', "%{$search}%");
            });
        }

        $plans = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $plans,
        ]);
    }
}
