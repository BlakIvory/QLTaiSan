<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (!Schema::hasColumn('organizations', 'path')) {
                $table->string('path')->nullable()->after('parent_id');
            }
            if (!Schema::hasColumn('organizations', 'level')) {
                $table->integer('level')->default(0)->after('path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (Schema::hasColumn('organizations', 'path')) {
                $table->dropColumn('path');
            }
            if (Schema::hasColumn('organizations', 'level')) {
                $table->dropColumn('level');
            }
        });
    }
};
