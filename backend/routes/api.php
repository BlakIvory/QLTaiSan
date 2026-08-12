<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\EquipmentController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\TransferController;
use App\Http\Controllers\Api\V1\DamageReportController;
use App\Http\Controllers\Api\V1\RepairController;
use App\Http\Controllers\Api\V1\MaintenanceController;
use App\Http\Controllers\Api\V1\InspectionController;
use App\Http\Controllers\Api\V1\EquipmentLoanController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\ContractController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\OptionController;
use Illuminate\Support\Facades\Route;

// ─── Public routes ─────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    // Options (can be public or authenticated as needed)
    Route::get('options',         [OptionController::class, 'index']);
    Route::get('options/{type}',  [OptionController::class, 'show']);

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('login',           [AuthController::class, 'login']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password',  [AuthController::class, 'resetPassword']);
    });

    // QR public scan (no auth needed for basic info)
    Route::get('equipment/qr/{code}', [EquipmentController::class, 'scanQr']);

});

// ─── Authenticated routes ───────────────────────────────────────────
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('logout',          [AuthController::class, 'logout']);
        Route::get('me',               [AuthController::class, 'me']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });

    // Dashboard
    Route::get('dashboard/stats',  [DashboardController::class, 'stats']);
    Route::get('dashboard/alerts', [DashboardController::class, 'alerts']);
    Route::get('dashboard/charts', [DashboardController::class, 'charts']);

    // Organizations
    Route::apiResource('organizations', OrganizationController::class);
    Route::put('organizations/{organization}/toggle-active', [OrganizationController::class, 'toggleActive']);
    Route::get('organizations/{organization}/tree', [OrganizationController::class, 'tree']);

    // Locations
    Route::apiResource('locations', \App\Http\Controllers\Api\V1\LocationController::class);

    // Categories
    Route::prefix('categories')->group(function () {
        Route::apiResource('equipment-groups',   CategoryController::class . '@equipmentGroups', ['as' => 'categories.equipment-groups']);
        Route::apiResource('equipment-types',    CategoryController::class . '@equipmentTypes',  ['as' => 'categories.equipment-types']);
        Route::apiResource('manufacturers',      CategoryController::class . '@manufacturers',    ['as' => 'categories.manufacturers']);
        Route::apiResource('countries',          CategoryController::class . '@countries',        ['as' => 'categories.countries']);
        Route::apiResource('funding-sources',    CategoryController::class . '@fundingSources',   ['as' => 'categories.funding-sources']);
    });

    // Simpler category routes
    Route::get('equipment-groups',    [CategoryController::class, 'indexGroups']);
    Route::post('equipment-groups',   [CategoryController::class, 'storeGroup']);
    Route::put('equipment-groups/{id}', [CategoryController::class, 'updateGroup']);

    Route::get('equipment-types',    [CategoryController::class, 'indexTypes']);
    Route::post('equipment-types',   [CategoryController::class, 'storeType']);
    Route::put('equipment-types/{id}', [CategoryController::class, 'updateType']);

    Route::get('manufacturers',    [CategoryController::class, 'indexManufacturers']);
    Route::post('manufacturers',   [CategoryController::class, 'storeManufacturer']);
    Route::put('manufacturers/{id}', [CategoryController::class, 'updateManufacturer']);

    Route::get('countries',    [CategoryController::class, 'indexCountries']);
    Route::post('countries',   [CategoryController::class, 'storeCountry']);

    Route::get('funding-sources',    [CategoryController::class, 'indexFundingSources']);
    Route::post('funding-sources',   [CategoryController::class, 'storeFundingSource']);

    // Equipment
    Route::apiResource('equipment', EquipmentController::class);
    Route::get('equipment/{equipment}/history',          [EquipmentController::class, 'history']);
    Route::get('equipment/{equipment}/maintenance',      [EquipmentController::class, 'maintenance']);
    Route::get('equipment/{equipment}/repairs',          [EquipmentController::class, 'repairs']);
    Route::get('equipment/{equipment}/inspections',      [EquipmentController::class, 'inspections']);
    Route::get('equipment/{equipment}/documents',        [EquipmentController::class, 'documents']);
    Route::post('equipment/{equipment}/images',          [EquipmentController::class, 'uploadImage']);
    Route::delete('equipment/{equipment}/images/{image}', [EquipmentController::class, 'deleteImage']);
    Route::get('equipment/{equipment}/qr',              [EquipmentController::class, 'generateQr']);
    Route::post('equipment/{equipment}/change-status',   [EquipmentController::class, 'changeStatus']);

    // Receipts (Tiếp nhận)
    Route::apiResource('receipts', \App\Http\Controllers\Api\V1\ReceiptController::class);
    Route::post('receipts/{receipt}/confirm', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'confirm']);

    // Allocations (Cấp phát)
    Route::apiResource('allocations', \App\Http\Controllers\Api\V1\AllocationController::class);
    Route::post('allocations/{allocation}/confirm',  [\App\Http\Controllers\Api\V1\AllocationController::class, 'confirm']);
    Route::post('allocations/{allocation}/handover', [\App\Http\Controllers\Api\V1\AllocationController::class, 'handover']);
    // Receipts & Handovers (Tiếp nhận & Bàn giao)
    Route::get('receipts/{receipt}/export-word', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'exportWord']);
    Route::post('receipts/{receipt}/upload-attachment', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'uploadAttachment']);
    Route::apiResource('receipts', \App\Http\Controllers\Api\V1\ReceiptController::class);

    // Transfers (Điều chuyển)
    Route::apiResource('transfers', TransferController::class);
    Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve']);
    Route::post('transfers/{transfer}/reject',  [TransferController::class, 'reject']);
    Route::post('transfers/{transfer}/handover',[TransferController::class, 'handover']);
    Route::post('transfers/{transfer}/complete',[TransferController::class, 'complete']);

    // Damage Reports (Báo hỏng)
    Route::apiResource('damage-reports', DamageReportController::class);
    Route::post('damage-reports/{damageReport}/assign', [DamageReportController::class, 'assign']);
    Route::post('damage-reports/{damageReport}/close',  [DamageReportController::class, 'close']);

    // Repairs (Sửa chữa)
    Route::apiResource('repairs', RepairController::class);
    Route::post('repairs/{repair}/approve',  [RepairController::class, 'approve']);
    Route::post('repairs/{repair}/reject',   [RepairController::class, 'reject']);
    Route::post('repairs/{repair}/complete', [RepairController::class, 'complete']);
    Route::post('repairs/{repair}/handover', [RepairController::class, 'handover']);
    Route::apiResource('repairs.parts', \App\Http\Controllers\Api\V1\RepairPartController::class)
         ->shallow();

    // Maintenance
    Route::apiResource('maintenance-plans',   MaintenanceController::class);
    Route::apiResource('maintenance-records', \App\Http\Controllers\Api\V1\MaintenanceRecordController::class);
    Route::post('maintenance-records/{record}/complete', [\App\Http\Controllers\Api\V1\MaintenanceRecordController::class, 'complete']);

    // Inspections (Kiểm định)
    Route::apiResource('inspections', InspectionController::class);

    // Loans (Mượn trả)
    Route::apiResource('equipment-loans', EquipmentLoanController::class);
    Route::post('equipment-loans/{equipmentLoan}/approve', [EquipmentLoanController::class, 'approve']);
    Route::post('equipment-loans/{equipmentLoan}/return',  [EquipmentLoanController::class, 'return']);

    // Inventories (Kiểm kê)
    Route::apiResource('inventories', InventoryController::class);
    Route::get('inventories/{inventory}/items',         [InventoryController::class, 'items']);
    Route::post('inventories/{inventory}/items/scan',   [InventoryController::class, 'scanItem']);
    Route::post('inventories/{inventory}/complete',     [InventoryController::class, 'complete']);

    // Recalls & Liquidations
    Route::apiResource('recalls',      \App\Http\Controllers\Api\V1\RecallController::class);
    Route::apiResource('liquidations', \App\Http\Controllers\Api\V1\LiquidationController::class);
    Route::post('liquidations/{liquidation}/approve', [\App\Http\Controllers\Api\V1\LiquidationController::class, 'approve']);
    Route::post('liquidations/{liquidation}/reject',  [\App\Http\Controllers\Api\V1\LiquidationController::class, 'reject']);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);
    Route::get('suppliers/{supplier}/equipment',  [SupplierController::class, 'equipment']);
    Route::get('suppliers/{supplier}/contracts',  [SupplierController::class, 'contracts']);

    // Contracts
    Route::apiResource('contracts', ContractController::class);

    // Attachments
    Route::post('attachments',           [\App\Http\Controllers\Api\V1\AttachmentController::class, 'store']);
    Route::delete('attachments/{attachment}', [\App\Http\Controllers\Api\V1\AttachmentController::class, 'destroy']);
    Route::get('attachments/{attachment}/download', [\App\Http\Controllers\Api\V1\AttachmentController::class, 'download']);

    // Notifications
    Route::get('notifications',           [NotificationController::class, 'index']);
    Route::put('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::put('notifications/read-all',  [NotificationController::class, 'markAllRead']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // Reports
    Route::get('reports/equipment-by-status',       [ReportController::class, 'equipmentByStatus']);
    Route::get('reports/equipment-by-organization', [ReportController::class, 'equipmentByOrganization']);
    Route::get('reports/repair-costs',              [ReportController::class, 'repairCosts']);
    Route::get('reports/maintenance-summary',       [ReportController::class, 'maintenanceSummary']);
    Route::get('reports/export',                    [ReportController::class, 'export']);

    // ─── Admin only ────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        // Users
        Route::apiResource('users', UserController::class);
        Route::put('users/{user}/lock',   [UserController::class, 'lock']);
        Route::put('users/{user}/unlock', [UserController::class, 'unlock']);
        Route::put('users/{user}/roles',  [UserController::class, 'syncRoles']);

        // Roles & Permissions
        Route::get('roles',              [\App\Http\Controllers\Api\V1\RoleController::class, 'index']);
        Route::post('roles',             [\App\Http\Controllers\Api\V1\RoleController::class, 'store']);
        Route::put('roles/{id}',         [\App\Http\Controllers\Api\V1\RoleController::class, 'update']);
        Route::delete('roles/{id}',      [\App\Http\Controllers\Api\V1\RoleController::class, 'destroy']);
        Route::put('roles/{id}/permissions', [\App\Http\Controllers\Api\V1\RoleController::class, 'syncPermissions']);
        Route::get('permissions',        [\App\Http\Controllers\Api\V1\RoleController::class, 'permissions']);

        // Audit Logs
        Route::get('audit-logs', [AuditLogController::class, 'index']);
    });

});
