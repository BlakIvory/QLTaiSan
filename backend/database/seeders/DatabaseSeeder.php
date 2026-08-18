<?php

namespace Database\Seeders;

use App\Enums\EquipmentStatus;
use App\Enums\ImportanceLevel;
use App\Models\Country;
use App\Models\Equipment;
use App\Models\EquipmentGroup;
use App\Models\EquipmentType;
use App\Models\FundingSource;
use App\Models\Location;
use App\Models\Organization;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Permissions ───────────────────────────────────────────
        $permissions = [
            'equipment.view', 'equipment.create', 'equipment.update', 'equipment.delete',
            'equipment.export', 'equipment.receive', 'equipment.allocate', 'equipment.transfer',
            'equipment.transfer.approve', 'equipment.recall', 'equipment.liquidate',
            'equipment.liquidate.approve',
            'damage_report.view', 'damage_report.create', 'damage_report.assign',
            'repair.view', 'repair.update', 'repair.approve', 'repair.complete',
            'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.complete',
            'inspection.view', 'inspection.create', 'inspection.update',
            'loan.view', 'loan.create', 'loan.approve', 'loan.return',
            'inventory.view', 'inventory.create', 'inventory.execute', 'inventory.complete',
            'supplier.view', 'supplier.create', 'supplier.update',
            'contract.view', 'contract.create', 'contract.update',
            'report.view', 'report.export',
            'user.view', 'user.create', 'user.update', 'user.lock',
            'role.manage', 'system.audit.view',
            'organization.view', 'organization.manage',
            'category.view', 'category.manage',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
        }

        // ─── Roles ─────────────────────────────────────────────────
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $adminRole->syncPermissions(Permission::all());

        $staffRole = Role::firstOrCreate(['name' => 'pvtttby', 'guard_name' => 'sanctum']);
        $staffRole->syncPermissions([
            'equipment.view', 'equipment.create', 'equipment.update',
            'equipment.receive', 'equipment.allocate', 'equipment.transfer',
            'equipment.recall', 'equipment.liquidate',
            'damage_report.view', 'damage_report.create', 'damage_report.assign',
            'repair.view', 'repair.update', 'repair.complete',
            'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.complete',
            'inspection.view', 'inspection.create', 'inspection.update',
            'loan.view', 'loan.create', 'loan.approve', 'loan.return',
            'inventory.view', 'inventory.create', 'inventory.execute', 'inventory.complete',
            'supplier.view', 'supplier.create', 'supplier.update',
            'contract.view', 'contract.create', 'contract.update',
            'report.view', 'report.export',
            'organization.view', 'category.view',
        ]);

        $deptRole = Role::firstOrCreate(['name' => 'department_staff', 'guard_name' => 'sanctum']);
        $deptRole->syncPermissions(['equipment.view', 'damage_report.create', 'damage_report.view']);

        $techRole = Role::firstOrCreate(['name' => 'technician', 'guard_name' => 'sanctum']);
        $techRole->syncPermissions(['repair.view', 'repair.update', 'repair.complete', 'maintenance.view', 'maintenance.update']);

        $leaderRole = Role::firstOrCreate(['name' => 'leader', 'guard_name' => 'sanctum']);
        $leaderRole->syncPermissions(['equipment.view', 'report.view', 'report.export', 'equipment.transfer.approve', 'repair.approve']);

        // ─── Organizations ─────────────────────────────────────────
        $hospital = Organization::firstOrCreate(
            ['code' => 'BV-HOA-HAO'],
            ['name' => 'Bệnh viện Đa khoa Hòa Hảo - Medic Cần Thơ', 'type' => 'HOSPITAL', 'is_active' => true]
        );

        $orgs = [
            ['code' => 'K-KHAMBENH', 'name' => 'Khoa Khám bệnh', 'type' => 'DEPARTMENT'],
            ['code' => 'K-NOI-TONG-HOP', 'name' => 'Khoa Nội Tổng hợp', 'type' => 'DEPARTMENT'],
            ['code' => 'K-NGOAI-TONG-HOP', 'name' => 'Khoa Ngoại Tổng hợp', 'type' => 'DEPARTMENT'],
            ['code' => 'K-CDHA', 'name' => 'Khoa Chẩn đoán hình ảnh', 'type' => 'DEPARTMENT'],
            ['code' => 'K-XETNGHIEM', 'name' => 'Khoa Xét nghiệm', 'type' => 'DEPARTMENT'],
            ['code' => 'K-PT-GMHS', 'name' => 'Khoa Phẫu thuật - Gây mê hồi sức', 'type' => 'DEPARTMENT'],
            ['code' => 'K-CAPCUU', 'name' => 'Khoa Cấp cứu', 'type' => 'DEPARTMENT'],
            ['code' => 'K-DUOC', 'name' => 'Khoa Dược', 'type' => 'DEPARTMENT'],
            ['code' => 'P-VAT-TU', 'name' => 'Phòng Vật tư – Thiết bị y tế', 'type' => 'WAREHOUSE'],
            ['code' => 'P-TCHC', 'name' => 'Phòng Tổ chức - Hành chính', 'type' => 'DEPARTMENT'],
            ['code' => 'P-TCKT', 'name' => 'Phòng Tài chính - Kế toán', 'type' => 'DEPARTMENT'],
            ['code' => 'P-DIEUDUONG', 'name' => 'Phòng Điều dưỡng - KSNK', 'type' => 'DEPARTMENT'],
            ['code' => 'P-QLCL', 'name' => 'Phòng Quản lý chất lượng', 'type' => 'DEPARTMENT'],
            ['code' => 'BGD', 'name' => 'Ban Giám đốc', 'type' => 'DEPARTMENT'],
        ];

        foreach ($orgs as $item) {
            Organization::firstOrCreate(
                ['code' => $item['code']],
                ['name' => $item['name'], 'type' => $item['type'], 'parent_id' => $hospital->id, 'is_active' => true]
            );
        }

        $warehouse = Organization::where('code', 'P-VAT-TU')->firstOrFail();
        $dept1 = Organization::where('code', 'K-NOI-TONG-HOP')->firstOrFail();
        $dept2 = Organization::where('code', 'K-CAPCUU')->firstOrFail();

        $loc1 = Location::firstOrCreate(
            ['code' => 'KNOI-P101'],
            ['name' => 'Phòng 101', 'organization_id' => $dept1->id, 'is_active' => true]
        );
        $loc2 = Location::firstOrCreate(
            ['code' => 'KCC-HSTC'],
            ['name' => 'Khu hồi sức tích cực', 'organization_id' => $dept2->id, 'is_active' => true]
        );
        $loc3 = Location::firstOrCreate(
            ['code' => 'PVT-KHO'],
            ['name' => 'Kho thiết bị', 'organization_id' => $warehouse->id, 'is_active' => true]
        );

        // ─── Countries ──────────────────────────────────────────────
        $vn = Country::firstOrCreate(['code' => 'VN'], ['name' => 'Việt Nam', 'is_active' => true]);
        $jp = Country::firstOrCreate(['code' => 'JP'], ['name' => 'Nhật Bản', 'is_active' => true]);
        $de = Country::firstOrCreate(['code' => 'DE'], ['name' => 'Đức', 'is_active' => true]);
        $us = Country::firstOrCreate(['code' => 'US'], ['name' => 'Hoa Kỳ', 'is_active' => true]);

        // ─── Equipment Groups & Types ───────────────────────────────
        $group1 = EquipmentGroup::firstOrCreate(
            ['code' => 'CHAN-DOAN'],
            ['name' => 'Thiết bị chẩn đoán', 'is_active' => true]
        );

        $group2 = EquipmentGroup::firstOrCreate(
            ['code' => 'DIEU-TRI'],
            ['name' => 'Thiết bị điều trị', 'is_active' => true]
        );

        $type1 = EquipmentType::firstOrCreate(
            ['code' => 'SIEU-AM'],
            ['name' => 'Máy siêu âm 4D', 'equipment_group_id' => $group1->id,
             'requires_maintenance' => true, 'requires_inspection' => true,
             'maintenance_cycle_days' => 180, 'inspection_cycle_days' => 365, 'is_active' => true]
        );

        $type2 = EquipmentType::firstOrCreate(
            ['code' => 'MAY-THO'],
            ['name' => 'Máy thở xâm nhập', 'equipment_group_id' => $group2->id,
             'requires_maintenance' => true, 'requires_inspection' => true,
             'maintenance_cycle_days' => 90, 'inspection_cycle_days' => 365, 'is_active' => true]
        );

        $type3 = EquipmentType::firstOrCreate(
            ['code' => 'MONITOR'],
            ['name' => 'Monitor theo dõi bệnh nhân 5 thông số', 'equipment_group_id' => $group2->id,
             'requires_maintenance' => true, 'requires_inspection' => false,
             'maintenance_cycle_days' => 180, 'is_active' => true]
        );

        // Funding Source & Supplier
        $funding = FundingSource::firstOrCreate(['code' => 'NGAN-SACH'], ['name' => 'Ngân sách nhà nước', 'is_active' => true]);
        $supplier = Supplier::firstOrCreate(
            ['code' => 'NCC-GE'],
            ['name' => 'Công ty TNHH Thiết bị Y tế GE Healthcare Việt Nam', 'phone' => '02439998888', 'is_active' => true]
        );

        // ─── Users ──────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@hospital.local'],
            [
                'name'          => 'Quản trị viên',
                'password'      => Hash::make('Admin@12345'),
                'employee_code' => 'ADMIN001',
                'organization_id' => $hospital->id,
                'is_active'     => true,
            ]
        );
        $admin->syncRoles(['admin']);

        $pvt = User::firstOrCreate(
            ['email' => 'pvt@hospital.local'],
            [
                'name'          => 'Cán bộ Phòng Vật tư – TTBYT',
                'password'      => Hash::make('Pvt@12345'),
                'employee_code' => 'PVT001',
                'organization_id' => $warehouse->id,
                'is_active'     => true,
            ]
        );
        $pvt->syncRoles(['pvtttby']);

        $deptStaff = User::firstOrCreate(
            ['email' => 'dept@hospital.local'],
            [
                'name'          => 'Nhân viên Khoa Nội',
                'password'      => Hash::make('Dept@12345'),
                'employee_code' => 'KNOI001',
                'organization_id' => $dept1->id,
                'is_active'     => true,
            ]
        );
        $deptStaff->syncRoles(['department_staff']);

        $tech = User::firstOrCreate(
            ['email' => 'tech@hospital.local'],
            [
                'name'          => 'Kỹ thuật viên Thiết bị',
                'password'      => Hash::make('Tech@12345'),
                'employee_code' => 'KTV001',
                'organization_id' => $warehouse->id,
                'is_active'     => true,
            ]
        );
        $tech->syncRoles(['technician']);

        $leader = User::firstOrCreate(
            ['email' => 'leader@hospital.local'],
            [
                'name'          => 'Ban Lãnh đạo Bệnh viện',
                'password'      => Hash::make('Leader@12345'),
                'employee_code' => 'BLD001',
                'organization_id' => $hospital->id,
                'is_active'     => true,
            ]
        );
        $leader->syncRoles(['leader']);

        // ─── Sample Equipment Data ──────────────────────────────────
        $sampleEquipments = [
            [
                'equipment_code'      => 'TB-2026-0001',
                'asset_code'          => 'TS-SA-01',
                'name'                => 'Máy siêu âm màu 4D Voluson E10',
                'equipment_type_id'   => $type1->id,
                'model'               => 'Voluson E10',
                'serial'              => 'SN-GE-4D-9988',
                'country_id'          => $jp->id,
                'year_of_manufacture' => 2023,
                'purchase_date'       => '2024-01-15',
                'in_use_date'         => '2024-02-01',
                'original_price'      => 1200000000.00,
                'current_value'       => 1050000000.00,
                'funding_source_id'   => $funding->id,
                'supplier_id'         => $supplier->id,
                'warranty_start'      => '2024-01-15',
                'warranty_end'        => '2026-08-25',
                'organization_id'     => $dept1->id,
                'location_id'         => $loc1->id,
                'status'              => EquipmentStatus::IN_USE->value,
                'importance_level'    => ImportanceLevel::CRITICAL->value,
                'requires_maintenance'=> true,
                'maintenance_cycle_days' => 180,
                'next_maintenance_date'  => '2026-07-15', // Overdue
            ],
            [
                'equipment_code'      => 'TB-2026-0002',
                'asset_code'          => 'TS-MT-02',
                'name'                => 'Máy thở cao cấp Servo-u',
                'equipment_type_id'   => $type2->id,
                'model'               => 'Servo-u',
                'serial'              => 'SN-MAQUET-7711',
                'country_id'          => $de->id,
                'year_of_manufacture' => 2022,
                'purchase_date'       => '2023-05-10',
                'in_use_date'         => '2023-06-01',
                'original_price'      => 850000000.00,
                'current_value'       => 680000000.00,
                'funding_source_id'   => $funding->id,
                'supplier_id'         => $supplier->id,
                'warranty_start'      => '2023-05-10',
                'warranty_end'        => '2025-05-10',
                'organization_id'     => $dept2->id,
                'location_id'         => $loc2->id,
                'status'              => EquipmentStatus::UNDER_REPAIR->value,
                'importance_level'    => ImportanceLevel::HIGH->value,
                'requires_maintenance'=> true,
                'maintenance_cycle_days' => 90,
                'next_maintenance_date'  => '2026-08-30',
            ],
            [
                'equipment_code'      => 'TB-2026-0003',
                'asset_code'          => 'TS-MN-03',
                'name'                => 'Monitor theo dõi bệnh nhân B450',
                'equipment_type_id'   => $type3->id,
                'model'               => 'B450',
                'serial'              => 'SN-GE-MON-3344',
                'country_id'          => $us->id,
                'year_of_manufacture' => 2024,
                'purchase_date'       => '2024-03-20',
                'in_use_date'         => '2024-04-01',
                'original_price'      => 150000000.00,
                'current_value'       => 140000000.00,
                'funding_source_id'   => $funding->id,
                'supplier_id'         => $supplier->id,
                'warranty_start'      => '2024-03-20',
                'warranty_end'        => '2026-03-20',
                'organization_id'     => $warehouse->id,
                'location_id'         => $loc3->id,
                'status'              => EquipmentStatus::AVAILABLE->value,
                'importance_level'    => ImportanceLevel::MEDIUM->value,
                'requires_maintenance'=> true,
                'maintenance_cycle_days' => 180,
                'next_maintenance_date'  => '2026-10-01',
            ],
        ];

        foreach ($sampleEquipments as $eq) {
            Equipment::firstOrCreate(['equipment_code' => $eq['equipment_code']], $eq);
        }

        $this->command->info('✅ Seed dữ liệu mẫu thành công!');
    }
}
