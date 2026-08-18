<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->string('invoice_number')->nullable()->after('code');
            $table->date('invoice_date')->nullable()->after('invoice_number');
            $table->decimal('total_amount', 20, 2)->nullable()->after('invoice_date');
        });

        Schema::table('receipt_items', function (Blueprint $table) {
            $table->string('unit')->nullable()->after('quantity');
            $table->text('notes')->nullable()->after('condition_note');
        });
    }

    public function down(): void
    {
        Schema::table('receipt_items', fn (Blueprint $table) => $table->dropColumn(['unit', 'notes']));
        Schema::table('receipts', fn (Blueprint $table) => $table->dropColumn(['invoice_number', 'invoice_date', 'total_amount']));
    }
};
