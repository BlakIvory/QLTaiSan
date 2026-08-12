<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('receipts')) {
            Schema::create('receipts', function (Blueprint $table) {
                $table->id();
                $table->string('receipt_code')->unique();
                $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
                $table->foreignId('from_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->foreignId('to_organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->date('from_date');
                $table->date('to_date')->nullable();
                $table->string('receiver_name')->nullable();
                $table->string('deliverer_name')->nullable();
                $table->string('status')->default('HANDED_OVER');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
