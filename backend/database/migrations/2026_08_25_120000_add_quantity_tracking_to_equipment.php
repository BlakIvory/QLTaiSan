<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->string('tracking_mode')->default('INDIVIDUAL')->after('equipment_code');
            $table->unsignedInteger('quantity')->default(1)->after('tracking_mode');
            $table->string('unit')->default('Cái')->after('quantity');
            $table->index('tracking_mode');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropIndex(['tracking_mode']);
            $table->dropColumn(['tracking_mode', 'quantity', 'unit']);
        });
    }
};
