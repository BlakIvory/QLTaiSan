<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\EquipmentGroup;
use App\Models\EquipmentType;
use App\Models\Location;
use App\Models\Organization;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class InventoryImportSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Locate the inventory excel file
        $candidates = [
            base_path('../thongkebaocao/KIỂM KỂ TÀI SẢN 30-06-2026 (KHÁM BỆNH).xlsx'),
            base_path('thongkebaocao/KIỂM KỂ TÀI SẢN 30-06-2026 (KHÁM BỆNH).xlsx'),
        ];
        $excelFile = null;
        foreach ($candidates as $cand) {
            if (file_exists($cand)) {
                $excelFile = $cand;
                break;
            }
        }
        if (!$excelFile) {
            $matched = glob(dirname(base_path()) . '/thongkebaocao/*.xlsx');
            if (!empty($matched)) {
                $excelFile = $matched[0];
            }
        }

        if (!$excelFile || !file_exists($excelFile)) {
            if ($this->command) {
                $this->command->error("Không tìm thấy file kiểm kê Excel trong thư mục thongkebaocao!");
            }
            return;
        }

        if ($this->command) {
            $this->command->info("Đang đọc file kiểm kê: " . basename($excelFile));
        }

        // 2. Ensure Department 'Khoa Khám bệnh' exists
        $hospital = Organization::where('code', 'BV-HOA-HAO')->first();
        if (!$hospital) {
            $hospital = Organization::firstOrCreate(
                ['code' => 'BV-HOA-HAO'],
                ['name' => 'Bệnh viện Đa khoa Hòa Hảo - Medic Cần Thơ', 'type' => 'HOSPITAL', 'is_active' => true]
            );
        }

        $dept = Organization::firstOrCreate(
            ['code' => 'K-KHAMBENH'],
            [
                'name'      => 'Khoa Khám bệnh',
                'type'      => 'DEPARTMENT',
                'parent_id' => $hospital->id,
                'is_active' => true,
            ]
        );

        // 3. Create standardized Equipment Groups & Types
        $groupsData = [
            'TB-Y-TE' => [
                'name' => 'Thiết bị Y tế & Khám chữa bệnh',
                'types' => [
                    'MAY-DO-HA-CD'      => ['name' => 'Máy đo HA & Dụng cụ chẩn đoán', 'maint' => true, 'insp' => true, 'cycle' => 180, 'level' => 'HIGH'],
                    'DEN-DOC-PHIM'      => ['name' => 'Đèn đọc phim & Chẩn đoán hình ảnh', 'maint' => true, 'insp' => false, 'cycle' => 180, 'level' => 'MEDIUM'],
                    'GIUONG-KHAM-BENH'  => ['name' => 'Giường khám bệnh chuyên khoa', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'MEDIUM'],
                    'TB-NOI-SOI-TMH'    => ['name' => 'Thiết bị nội soi & Tai mũi họng', 'maint' => true, 'insp' => true, 'cycle' => 90, 'level' => 'CRITICAL'],
                    'Y-DUNG-CU'         => ['name' => 'Y dụng cụ & Phụ kiện y tế', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'MEDIUM'],
                ],
            ],
            'TB-CNTT-VT' => [
                'name' => 'Thiết bị CNTT & Viễn thông',
                'types' => [
                    'MAY-VI-TINH'       => ['name' => 'Máy vi tính & Màn hình làm việc', 'maint' => true, 'insp' => false, 'cycle' => 180, 'level' => 'MEDIUM'],
                    'MAY-IN-QUET'       => ['name' => 'Máy in, Máy quét mã vạch & Vân tay', 'maint' => true, 'insp' => false, 'cycle' => 180, 'level' => 'MEDIUM'],
                    'DIEN-THOAI-IP'     => ['name' => 'Điện thoại IP & Thiết bị liên lạc', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'MEDIUM'],
                    'TI-VI-MAN-HINH'    => ['name' => 'Tivi & Màn hình hiển thị thông minh', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'MEDIUM'],
                ],
            ],
            'NOI-THAT-VP' => [
                'name' => 'Bàn ghế & Nội thất văn phòng',
                'types' => [
                    'BAN-LAM-VIEC'      => ['name' => 'Bàn làm việc & Bàn họp', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'LOW'],
                    'GHE-VAN-PHONG'     => ['name' => 'Ghế văn phòng & Ghế phòng chờ', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'LOW'],
                    'TU-TAI-LIEU'       => ['name' => 'Tủ hồ sơ, Tủ sắt & Tủ thuốc', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'LOW'],
                    'QUAY-VACH-TT'      => ['name' => 'Quầy giao dịch & Vách trang trí', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'LOW'],
                ],
            ],
            'TIEN-ICH-TT' => [
                'name' => 'Thiết bị điện & Tiện ích sinh hoạt',
                'types' => [
                    'QUAT-CAY-NUOC'     => ['name' => 'Quạt điện & Cây nước nóng lạnh', 'maint' => true, 'insp' => false, 'cycle' => 180, 'level' => 'LOW'],
                    'TU-LANH-GD'        => ['name' => 'Tủ lạnh & Thiết bị điện máy', 'maint' => true, 'insp' => false, 'cycle' => 180, 'level' => 'LOW'],
                ],
            ],
            'DO-VAI-DC' => [
                'name' => 'Đồ vải & Vật tư sử dụng',
                'types' => [
                    'DO-VAI-BV'         => ['name' => 'Đồ vải bệnh viện (Drap, Gối, Áo, Khăn)', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'LOW'],
                    'DUNG-CU-KHAC'      => ['name' => 'Dụng cụ & Trang bị khác', 'maint' => false, 'insp' => false, 'cycle' => null, 'level' => 'LOW'],
                ],
            ],
        ];

        $typeModels = [];
        foreach ($groupsData as $groupCode => $gInfo) {
            $group = EquipmentGroup::firstOrCreate(
                ['code' => $groupCode],
                ['name' => $gInfo['name'], 'is_active' => true]
            );

            foreach ($gInfo['types'] as $typeCode => $tInfo) {
                $type = EquipmentType::firstOrCreate(
                    ['code' => $typeCode],
                    [
                        'name'                   => $tInfo['name'],
                        'equipment_group_id'     => $group->id,
                        'requires_maintenance'   => $tInfo['maint'],
                        'requires_inspection'    => $tInfo['insp'],
                        'maintenance_cycle_days' => $tInfo['cycle'],
                        'is_active'              => true,
                    ]
                );
                $typeModels[$typeCode] = [
                    'id'               => $type->id,
                    'importance_level' => $tInfo['level'],
                ];
            }
        }

        // Helper to classify equipment name into type code
        $classifyType = function (string $name) {
            $lower = mb_strtolower($name, 'UTF-8');
            if (preg_match('/(máy tính|optilex|dell|inspiron|vostro|cpu)/u', $lower)) return 'MAY-VI-TINH';
            if (preg_match('/(máy in|canon 2900|mã vạch|zebra|vân tay)/u', $lower)) return 'MAY-IN-QUET';
            if (preg_match('/(điện thoại|panasonic kx)/u', $lower)) return 'DIEN-THOAI-IP';
            if (preg_match('/(màn hình|tivi|signage)/u', $lower)) return 'TI-VI-MAN-HINH';
            if (preg_match('/(huyết áp|ống nghe|búa gõ|yamasu)/u', $lower)) return 'MAY-DO-HA-CD';
            if (preg_match('/(đèn đọc phim)/u', $lower)) return 'DEN-DOC-PHIM';
            if (preg_match('/(giường khám)/u', $lower)) return 'GIUONG-KHAM-BENH';
            if (preg_match('/(nội soi)/u', $lower)) return 'TB-NOI-SOI-TMH';
            if (preg_match('/(bàn làm việc|bàn họp|bàn phụ|bàn gỗ)/u', $lower)) return 'BAN-LAM-VIEC';
            if (preg_match('/(ghế)/u', $lower)) return 'GHE-VAN-PHONG';
            if (preg_match('/(tủ tài liệu|tủ sắt|tủ gỗ|tủ thuốc|tạp 3 ngăn|kệ dép|tủ đưng)/u', $lower)) return 'TU-TAI-LIEU';
            if (preg_match('/(quầy|vách trang trí)/u', $lower)) return 'QUAY-VACH-TT';
            if (preg_match('/(quạt|cây nước|cân sức khỏe)/u', $lower)) return 'QUAT-CAY-NUOC';
            if (preg_match('/(tủ lạnh)/u', $lower)) return 'TU-LANH-GD';
            if (preg_match('/(drap|gối|áo gối|khăn|váy)/u', $lower)) return 'DO-VAI-BV';
            if (preg_match('/(hộp inox|val âm đạo|banh âm đạo|y dụng cụ|hộp đựng gòn)/u', $lower)) return 'Y-DUNG-CU';
            return 'DUNG-CU-KHAC';
        };

        // 4. Load Excel file
        $reader = IOFactory::createReaderForFile($excelFile);
        $reader->setReadDataOnly(false);
        $spreadsheet = $reader->load($excelFile);
        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = $sheet->getHighestRow();

        $isRoman = function ($str) {
            $s = trim($str);
            return preg_match('/^(X{0,4})(IX|IV|V?I{0,4})$/i', $s) && strlen($s) > 0;
        };

        Equipment::where('equipment_code', 'LIKE', 'TB-KB-%')->forceDelete();
        Location::where('code', 'LIKE', '%KKB-%')->delete();
        Organization::where('code', 'LIKE', 'KKB-%')->delete();

        $currentRoomOrg = null;
        $currentLocation = null;
        $roomOrgMap = [];
        $locationMap = [];
        $locationIndex = 0;
        $itemsImported = 0;
        $equipIndex = 1;

        if ($this->command) {
            $this->command->info("Đang xử lý dữ liệu từ dòng 17 đến dòng $highestRow...");
        }

        for ($r = 17; $r <= $highestRow; $r++) {
            $colA = trim((string)$sheet->getCell('A' . $r)->getCalculatedValue());
            $colB = trim((string)$sheet->getCell('B' . $r)->getCalculatedValue());
            $colC = trim((string)$sheet->getCell('C' . $r)->getCalculatedValue());
            $colD = trim((string)$sheet->getCell('D' . $r)->getCalculatedValue());
            $colE = $sheet->getCell('E' . $r)->getCalculatedValue(); // Đơn giá
            $colF = $sheet->getCell('F' . $r)->getCalculatedValue(); // SL sổ sách
            $colH = $sheet->getCell('H' . $r)->getCalculatedValue(); // SL kiểm kê

            if ($colA === '' && $colB === '') continue;

            // Stop at summary / signature lines
            if (stripos($colB, 'Trưởng ban') !== false || stripos($colB, 'Tổ kiểm kê') !== false || stripos($colA, 'Tổng cộng') !== false) {
                break;
            }

            // Department title
            if ($colA === 'A' && stripos($colB, 'KHOA KHÁM BỆNH') !== false) {
                continue;
            }

            // Detect Room header
            $isRoomHeader = false;
            if ($isRoman($colA) && !empty($colB) && !is_numeric($colA)) {
                $isRoomHeader = true;
            } elseif ($colA === '' && preg_match('/^(PHÒNG|QUẦY|HÀNH LANG|Y DỤNG CỤ|ĐỒ VẢI)/iu', $colB)) {
                $isRoomHeader = true;
            }

            if ($isRoomHeader) {
                $roomName = $colB;
                if (!isset($roomOrgMap[$roomName])) {
                    $locationIndex++;
                    $roomCode = sprintf("KKB-P%02d", $locationIndex);

                    // Tạo Đơn vị cấp Phòng (ROOM) trực thuộc Khoa Khám bệnh
                    $roomOrg = Organization::updateOrCreate(
                        ['code' => $roomCode],
                        [
                            'name'        => $roomName,
                            'type'        => 'ROOM',
                            'parent_id'   => $dept->id,
                            'description' => "Phòng/Khu vực thuộc Khoa Khám bệnh (Kiểm kê 30/06/2026)",
                            'is_active'   => true,
                        ]
                    );
                    $roomOrgMap[$roomName] = $roomOrg;

                    // Tạo Vị trí lắp đặt (Location) gắn với Phòng
                    $locCode = sprintf("LOC-KKB-P%02d", $locationIndex);
                    $location = Location::updateOrCreate(
                        ['code' => $locCode],
                        [
                            'name'            => $roomName,
                            'organization_id' => $roomOrg->id,
                            'description'     => "Vị trí tại {$dept->name} - {$roomName}",
                            'is_active'       => true,
                        ]
                    );
                    $locationMap[$roomName] = $location;
                }
                $currentRoomOrg = $roomOrgMap[$roomName];
                $currentLocation = $locationMap[$roomName];
                continue;
            }

            // Equipment Item
            if (!empty($colB) && $currentRoomOrg) {
                $rawQty = 1;
                if (is_numeric($colF) && (float)$colF > 0) {
                    $rawQty = (float)$colF;
                } elseif (is_numeric($colH) && (float)$colH > 0) {
                    $rawQty = (float)$colH;
                }
                $qty = max(1, (int)round($rawQty));

                $unitPrice = is_numeric($colE) && (float)$colE > 0 ? (float)$colE : 0;
                $unit = $colD ?: 'Cái';

                $typeCode = $classifyType($colB);
                $typeMeta = $typeModels[$typeCode] ?? $typeModels['DUNG-CU-KHAC'];

                // Decide tracking mode
                // Furniture, linen, high quantity supplies are BATCH; single medical/IT devices are INDIVIDUAL
                $isBatch = ($qty > 1) || in_array($typeCode, ['DO-VAI-BV', 'GHE-VAN-PHONG', 'BAN-LAM-VIEC', 'TU-TAI-LIEU', 'Y-DUNG-CU']);
                $trackingMode = $isBatch ? 'BATCH' : 'INDIVIDUAL';

                $equipmentCode = sprintf("TB-KB-%04d", $equipIndex);
                $equipIndex++;

                // Asset code from Col C if present
                $assetCode = !empty($colC) ? $colC : null;

                Equipment::create([
                    'equipment_code'         => $equipmentCode,
                    'asset_code'             => $assetCode,
                    'tracking_mode'          => $trackingMode,
                    'quantity'               => $qty,
                    'unit'                   => $unit,
                    'name'                   => $colB,
                    'equipment_type_id'      => $typeMeta['id'],
                    'model'                  => $assetCode,
                    'purchase_date'          => '2026-06-30',
                    'in_use_date'            => '2026-06-30',
                    'original_price'         => $unitPrice > 0 ? $unitPrice : null,
                    'current_value'          => $unitPrice > 0 ? $unitPrice : null,
                    'organization_id'        => $currentRoomOrg->id,
                    'location_id'            => $currentLocation->id,
                    'status'                 => 'IN_USE',
                    'importance_level'       => $typeMeta['importance_level'],
                    'requires_maintenance'   => in_array($typeCode, ['MAY-DO-HA-CD', 'DEN-DOC-PHIM', 'TB-NOI-SOI-TMH', 'MAY-VI-TINH', 'MAY-IN-QUET', 'QUAT-CAY-NUOC', 'TU-LANH-GD']),
                    'maintenance_cycle_days' => in_array($typeCode, ['TB-NOI-SOI-TMH']) ? 90 : 180,
                    'notes'                  => "Nhập từ file kiểm kê tài sản ngày 30/06/2026 ({$currentRoomOrg->name})",
                ]);

                $itemsImported++;
            }
        }

        $totalLocations = count($locationMap);
        if ($this->command) {
            $this->command->info("✅ Đã trích xuất & nạp thành công:");
            $this->command->info("   - {$totalLocations} Khoa/Phòng/Vị trí thuộc 'Khoa Khám bệnh'.");
            $this->command->info("   - {$itemsImported} Thiết bị/Tài sản vào hệ thống.");
        }
    }
}
