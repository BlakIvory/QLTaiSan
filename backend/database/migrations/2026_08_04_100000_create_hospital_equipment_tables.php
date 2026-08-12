<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Organizations (khoa/phòng/cơ sở)
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('type'); // HOSPITAL, CAMPUS, BLOCK, DEPARTMENT, ROOM, WAREHOUSE
            $table->foreignId('parent_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'type', 'is_active']);
        });

        // 2. Locations (vị trí trong khoa/phòng)
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['organization_id', 'is_active']);
        });

        // 3. Countries
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Equipment Groups
        Schema::create('equipment_groups', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('code');
        });

        // 5. Equipment Types
        Schema::create('equipment_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('equipment_group_id')->constrained()->restrictOnDelete();
            $table->text('description')->nullable();
            $table->boolean('requires_maintenance')->default(false);
            $table->boolean('requires_inspection')->default(false);
            $table->integer('maintenance_cycle_days')->nullable();
            $table->integer('inspection_cycle_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['code', 'equipment_group_id', 'is_active']);
        });

        // 6. Manufacturers
        Schema::create('manufacturers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->string('website')->nullable();
            $table->string('contact_info')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('code');
        });

        // 7. Funding Sources
        Schema::create('funding_sources', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 8. Suppliers
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('tax_code')->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'is_active']);
        });

        // 9. Contracts
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('contract_number')->unique();
            $table->string('name');
            $table->string('contract_type');
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->date('signed_date')->nullable();
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('value', 20, 2)->nullable();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('DRAFT');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['contract_number', 'status', 'expiry_date', 'supplier_id']);
        });

        // 10. Equipment (main table)
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->string('equipment_code')->unique();
            $table->string('asset_code')->nullable();
            $table->string('name');
            $table->foreignId('equipment_type_id')->constrained()->restrictOnDelete();
            $table->string('model')->nullable();
            $table->string('serial')->nullable();
            $table->foreignId('manufacturer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('country_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('year_of_manufacture')->nullable();
            $table->date('purchase_date')->nullable();
            $table->date('in_use_date')->nullable();
            $table->decimal('original_price', 20, 2)->nullable();
            $table->decimal('current_value', 20, 2)->nullable();
            $table->foreignId('funding_source_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contract_number')->nullable();
            $table->date('warranty_start')->nullable();
            $table->date('warranty_end')->nullable();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('PENDING_RECEIPT');
            $table->string('importance_level')->default('MEDIUM');
            $table->boolean('requires_maintenance')->default(false);
            $table->boolean('requires_inspection')->default(false);
            $table->integer('maintenance_cycle_days')->nullable();
            $table->integer('inspection_cycle_days')->nullable();
            $table->date('last_maintenance_date')->nullable();
            $table->date('next_maintenance_date')->nullable();
            $table->date('last_inspection_date')->nullable();
            $table->date('next_inspection_date')->nullable();
            $table->string('qr_code')->nullable()->unique();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('equipment_code');
            $table->index('serial');
            $table->index('status');
            $table->index('organization_id');
            $table->index('equipment_type_id');
            $table->index('supplier_id');
            $table->index('warranty_end');
            $table->index('next_maintenance_date');
            $table->index('next_inspection_date');
            $table->index('created_at');
        });

        // 11. Equipment Images
        Schema::create('equipment_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index('equipment_id');
        });

        // 12. Equipment Status Histories
        Schema::create('equipment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at');
            $table->index(['equipment_id', 'changed_at']);
        });

        // 13. Equipment Location Histories
        Schema::create('equipment_location_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('to_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('from_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('to_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('reason')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at');
            $table->index(['equipment_id', 'changed_at']);
        });

        // 14. Receipts (Phiếu tiếp nhận)
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contract_number')->nullable();
            $table->date('receipt_date');
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'status', 'created_at']);
        });

        Schema::create('receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receipt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->integer('quantity')->default(1);
            $table->string('condition_note')->nullable();
            $table->timestamps();
        });

        // 15. Allocations (Phiếu cấp phát)
        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('from_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('to_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('allocation_date');
            $table->string('status')->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'status', 'created_at']);
        });

        Schema::create('allocation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('allocation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->string('condition_at_handover')->nullable();
            $table->timestamps();
        });

        // 16. Transfers (Phiếu điều chuyển)
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->foreignId('from_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('to_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('from_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('to_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->text('reason');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('requested_date');
            $table->timestamp('approved_at')->nullable();
            $table->date('executed_date')->nullable();
            $table->string('status')->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'status', 'equipment_id', 'created_at']);
        });

        // 17. Damage Reports (Phiếu báo hỏng)
        Schema::create('damage_reports', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('detected_at');
            $table->text('description');
            $table->string('priority')->default('MEDIUM');
            $table->string('status')->default('NEW');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'status', 'equipment_id', 'created_at']);
        });

        // 18. Repairs (Phiếu sửa chữa)
        Schema::create('repairs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('damage_report_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('inspection_result')->nullable();
            $table->string('damage_cause')->nullable();
            $table->string('repair_method')->nullable();
            $table->string('repair_unit')->nullable();
            $table->date('start_date')->nullable();
            $table->date('completion_date')->nullable();
            $table->decimal('parts_cost', 20, 2)->default(0);
            $table->decimal('labor_cost', 20, 2)->default(0);
            $table->decimal('total_cost', 20, 2)->default(0);
            $table->text('repair_result')->nullable();
            $table->date('warranty_until')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->string('status')->default('NEW');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'status', 'equipment_id', 'created_at']);
        });

        Schema::create('repair_parts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('repair_id')->constrained()->cascadeOnDelete();
            $table->string('part_name');
            $table->integer('quantity')->default(1);
            $table->string('unit')->nullable();
            $table->decimal('unit_price', 20, 2)->default(0);
            $table->decimal('total_price', 20, 2)->default(0);
            $table->timestamps();
        });

        // 19. Maintenance Plans
        Schema::create('maintenance_plans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->string('maintenance_type');
            $table->integer('cycle_days');
            $table->date('last_maintenance_date')->nullable();
            $table->date('next_maintenance_date');
            $table->string('status')->default('SCHEDULED');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['equipment_id', 'next_maintenance_date', 'status']);
        });

        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('maintenance_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->date('scheduled_date')->nullable();
            $table->date('actual_date')->nullable();
            $table->string('performed_by_unit')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('content')->nullable();
            $table->text('result')->nullable();
            $table->decimal('cost', 20, 2)->default(0);
            $table->string('status')->default('SCHEDULED');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['equipment_id', 'status', 'actual_date']);
        });

        // 20. Inspections (Kiểm định)
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->string('inspection_type');
            $table->string('inspection_unit')->nullable();
            $table->string('certificate_number')->nullable();
            $table->date('inspection_date');
            $table->date('expiry_date')->nullable();
            $table->string('result')->nullable();
            $table->date('next_inspection_date')->nullable();
            $table->string('certificate_file')->nullable();
            $table->string('validity_status')->default('VALID');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['equipment_id', 'expiry_date', 'validity_status']);
        });

        // 21. Equipment Loans (Mượn trả)
        Schema::create('equipment_loans', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('from_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('to_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('borrower_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('purpose')->nullable();
            $table->date('loan_date');
            $table->date('expected_return_date');
            $table->date('actual_return_date')->nullable();
            $table->string('condition_at_loan')->nullable();
            $table->string('condition_at_return')->nullable();
            $table->string('status')->default('PENDING');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['code', 'status', 'expected_return_date']);
        });

        Schema::create('equipment_loan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('equipment_loans')->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->timestamps();
        });

        // 22. Inventories (Kiểm kê)
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('conducted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('status')->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['code', 'status', 'organization_id']);
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained()->cascadeOnDelete();
            $table->foreignId('equipment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('expected_status')->nullable();
            $table->string('actual_status')->nullable();
            $table->foreignId('actual_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('discrepancy_note')->nullable();
            $table->string('result')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 23. Recalls (Thu hồi)
        Schema::create('recalls', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->text('reason');
            $table->date('requested_date');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->decimal('remaining_value', 20, 2)->nullable();
            $table->string('processing_method')->nullable();
            $table->string('status')->default('PENDING');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['code', 'status', 'equipment_id']);
        });

        // 24. Liquidations (Thanh lý)
        Schema::create('liquidations', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('equipment_id')->constrained()->restrictOnDelete();
            $table->text('reason');
            $table->date('requested_date');
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->decimal('remaining_value', 20, 2)->nullable();
            $table->string('processing_method')->nullable();
            $table->string('decision_number')->nullable();
            $table->string('status')->default('PENDING');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['code', 'status', 'equipment_id']);
        });

        // 25. Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            $table->string('type');
            $table->string('related_module')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'is_read', 'created_at']);
        });

        // 26. Attachments (polymorphic)
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->morphs('attachable');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('document_type')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 27. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('module');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'module', 'action', 'created_at']);
        });

        // 28. Approval Histories
        Schema::create('approval_histories', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable');
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('action'); // approved, rejected, cancelled
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        // Update users table to add organization and extra fields
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('email')->constrained()->nullOnDelete();
            $table->string('phone')->nullable()->after('organization_id');
            $table->string('employee_code')->nullable()->unique()->after('phone');
            $table->text('address')->nullable()->after('employee_code');
            $table->boolean('is_active')->default(true)->after('address');
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            $table->timestamp('locked_at')->nullable()->after('last_login_at');
            $table->integer('failed_login_count')->default(0)->after('locked_at');
            $table->string('avatar')->nullable()->after('failed_login_count');
            $table->softDeletes();
            $table->index(['organization_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'organization_id', 'phone', 'employee_code', 'address',
                'is_active', 'last_login_at', 'locked_at', 'failed_login_count', 'avatar'
            ]);
            $table->dropSoftDeletes();
        });

        Schema::dropIfExists('approval_histories');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('liquidations');
        Schema::dropIfExists('recalls');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('equipment_loan_items');
        Schema::dropIfExists('equipment_loans');
        Schema::dropIfExists('inspections');
        Schema::dropIfExists('maintenance_records');
        Schema::dropIfExists('maintenance_plans');
        Schema::dropIfExists('repair_parts');
        Schema::dropIfExists('repairs');
        Schema::dropIfExists('damage_reports');
        Schema::dropIfExists('transfers');
        Schema::dropIfExists('allocation_items');
        Schema::dropIfExists('allocations');
        Schema::dropIfExists('receipt_items');
        Schema::dropIfExists('receipts');
        Schema::dropIfExists('equipment_location_histories');
        Schema::dropIfExists('equipment_status_histories');
        Schema::dropIfExists('equipment_images');
        Schema::dropIfExists('equipment');
        Schema::dropIfExists('contracts');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('funding_sources');
        Schema::dropIfExists('manufacturers');
        Schema::dropIfExists('equipment_types');
        Schema::dropIfExists('equipment_groups');
        Schema::dropIfExists('countries');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('organizations');
    }
};
