<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Bảng tổng hợp đề nghị mua (phòng tổng hợp lập) - tạo trước vì purchase_requests tham chiếu
        Schema::create('purchase_request_summaries', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');                  // Tiêu đề bảng tổng hợp
            $table->string('period')->nullable();     // Kỳ tổng hợp (Q1/2026, T8/2026...)
            $table->date('summary_date');
            $table->decimal('total_estimated', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('DRAFT');
            // DRAFT → FINALIZED (hoàn thiện) → SUBMITTED_TO_BOARD (đã trình BGĐ)
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'created_at']);
        });

        // Bảng đề nghị mua tài sản (cá nhân/khoa lập)
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('requester_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('organization_id')->constrained()->restrictOnDelete(); // Khoa/phòng đề nghị
            $table->string('item_name');              // Tên tài sản/thiết bị đề nghị mua
            $table->string('category')->nullable();   // Nhóm/loại thiết bị
            $table->integer('quantity')->default(1);
            $table->string('unit')->default('Cái');
            $table->decimal('estimated_price', 15, 2)->nullable(); // Đơn giá ước tính
            $table->decimal('estimated_total', 15, 2)->nullable(); // Thành tiền ước tính
            $table->text('reason');                   // Lý do/mục đích đề nghị
            $table->text('specifications')->nullable(); // Yêu cầu kỹ thuật
            $table->string('priority')->default('NORMAL'); // LOW, NORMAL, HIGH, URGENT
            $table->date('needed_by')->nullable();    // Ngày cần có
            $table->string('status')->default('DRAFT');
            // DRAFT → SUBMITTED → CONSOLIDATED (đã được tổng hợp) → REJECTED
            $table->foreignId('summary_id')->nullable()->constrained('purchase_request_summaries')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'status', 'created_at']);
        });

        // Bảng tờ trình chủ trương gửi BGĐ
        Schema::create('proposal_documents', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');                  // Tiêu đề tờ trình
            $table->foreignId('summary_id')->constrained('purchase_request_summaries')->restrictOnDelete();
            $table->date('proposal_date');
            $table->decimal('total_amount', 15, 2)->nullable();
            $table->text('content')->nullable();      // Nội dung tờ trình
            $table->text('justification')->nullable(); // Căn cứ/lý do
            $table->string('status')->default('DRAFT');
            // DRAFT → SUBMITTED (trình BGĐ) → APPROVED → REJECTED
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('board_notes')->nullable();   // Ý kiến BGĐ
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_documents');
        Schema::dropIfExists('purchase_requests');
        Schema::dropIfExists('purchase_request_summaries');
    }
};
