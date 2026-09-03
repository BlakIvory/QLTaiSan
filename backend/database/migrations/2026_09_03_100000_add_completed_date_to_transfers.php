<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            // Tách riêng ngày bàn giao (bên giao) và ngày hoàn tất (bên nhận)
            $table->date('completed_date')->nullable()->after('executed_date');
        });
    }

    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropColumn('completed_date');
        });
    }
};
