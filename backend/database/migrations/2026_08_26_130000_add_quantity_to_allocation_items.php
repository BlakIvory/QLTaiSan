<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('allocation_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->default(1)->after('equipment_id');
        });
    }

    public function down(): void
    {
        Schema::table('allocation_items', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });
    }
};
