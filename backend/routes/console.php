<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('import:inventory {--fresh : Làm sạch toàn bộ thiết bị và vị trí cũ trước khi nạp}', function () {
    if ($this->option('fresh')) {
        $this->warn('Đang làm sạch dữ liệu cũ...');
        \App\Models\Equipment::query()->forceDelete();
        \App\Models\Location::where('code', 'LIKE', '%KKB-%')->delete();
        \App\Models\Organization::where('code', 'LIKE', 'KKB-%')->delete();
    }
    $seeder = new \Database\Seeders\InventoryImportSeeder();
    $seeder->setCommand($this);
    $seeder->run();
})->purpose('Nạp danh mục khoa/phòng và thiết bị từ file Excel kiểm kê thực tế');
