<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Make equipment_id nullable in receipts table
        Schema::table('receipts', function (Blueprint $table) {
            $table->unsignedBigInteger('equipment_id')->nullable()->change();
        });

        // 2. Create receipt_items table for multi-equipment handover
        if (!Schema::hasTable('receipt_items')) {
            Schema::create('receipt_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('receipt_id')->constrained('receipts')->cascadeOnDelete();
                $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
                $table->integer('quantity')->default(1);
                $table->string('unit')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_items');
    }
};
