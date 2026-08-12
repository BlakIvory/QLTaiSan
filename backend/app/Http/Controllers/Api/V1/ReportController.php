<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\Organization;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ReportController extends Controller
{
    public function export(Request $request)
    {
        $orgId      = $request->input('organization_id');
        $status     = $request->input('status');
        $reportDate = $request->input('report_date', date('d/m/Y'));

        $query = Equipment::with(['equipmentType', 'organization', 'location', 'supplier']);

        if ($orgId) {
            $query->where('organization_id', $orgId);
            $org = Organization::find($orgId);
            $orgName = $org ? $org->name : 'Đơn vị';
        } else {
            $orgName = 'Toàn Bệnh viện';
        }

        if ($status) {
            $query->where('status', $status);
        }

        $equipments = $query->orderBy('equipment_code')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sheet1');

        // Page setup: Landscape
        $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);

        // Row 1 & 2: Hospital Header & Quốc Hiệu
        $sheet->mergeCells('A1:E2');
        $sheet->setCellValue('A1', "BỆNH VIỆN ĐA KHOA\nHÒA HẢO - MEDIC CẦN THƠ");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);

        $sheet->mergeCells('G1:P2');
        $sheet->setCellValue('G1', "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc");
        $sheet->getStyle('G1')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('G1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);

        // Row 3: Report Title
        $sheet->mergeCells('A3:P3');
        $sheet->setCellValue('A3', "BIÊN BẢN KIỂM KÊ VẬT TƯ, CÔNG CỤ, SẢN PHẨM, HÀNG HOÁ\nThời điểm: " . $reportDate);
        $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setWrapText(true);

        // Row 4: Organization
        $sheet->mergeCells('A4:P4');
        $sheet->setCellValue('A4', "Đơn vị: " . $orgName);
        $sheet->getStyle('A4')->getFont()->setBold(true)->setSize(11);
        $sheet->getStyle('A4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Rows 5 to 11: Committee Members
        $sheet->setCellValue('A5', 'Tổ kiểm kê gồm:');
        $sheet->getStyle('A5')->getFont()->setItalic(true);

        $committee = [
            ['1', 'Ông: Chu Văn Vinh', 'Chức vụ: Giám đốc BV', 'Trưởng ban'],
            ['2', 'Bà: Văn Thị Hồng Thảo', 'Chức vụ: Phòng TCKT', 'Thành viên'],
            ['3', 'Ông: Trương Anh Ngôn', 'Chức vụ: Phó Phòng TCHC-QT', 'Thành viên'],
            ['4', 'Ông: Hồ Thanh Thiên', 'Chức vụ: Phòng Điều dưỡng-KSNK', 'Thành viên'],
            ['5', 'Ông: Trần Như Công', 'Chức vụ: Phòng QLTBYT-CNTT', 'Thành viên'],
            ['6', 'Bà: Phạm Thị Bích Phương', 'Chức vụ: Điều dưỡng Trưởng Khoa', 'Thành viên'],
        ];

        foreach ($committee as $cIndex => $member) {
            $r = 6 + $cIndex;
            $sheet->setCellValue("A$r", $member[0]);
            $sheet->setCellValue("B$r", $member[1]);
            $sheet->setCellValue("E$r", $member[2]);
            $sheet->setCellValue("L$r", $member[3]);
        }

        $sheet->setCellValue('B12', 'Đã kiểm kê kho có những mặt hàng dưới đây:');
        $sheet->getStyle('B12')->getFont()->setItalic(true);

        // Multi-level Table Headers (Rows 14 - 16, 16 Columns: A to P)
        $sheet->mergeCells('A14:A16'); $sheet->setCellValue('A14', 'STT');
        $sheet->mergeCells('B14:B16'); $sheet->setCellValue('B14', "Tên, nhãn hiệu, quy\ncách vật tư, dụng cụ…");
        $sheet->mergeCells('C14:C16'); $sheet->setCellValue('C14', "Mã\nsố");
        $sheet->mergeCells('D14:D16'); $sheet->setCellValue('D14', "Đơn\nvị\ntính");
        $sheet->mergeCells('E14:E16'); $sheet->setCellValue('E14', "Đơn\ngiá");
        $sheet->mergeCells('F14:G14'); $sheet->setCellValue('F14', 'Theo sổ kế toán');
        $sheet->mergeCells('H14:I14'); $sheet->setCellValue('H14', 'Theo kiểm kê');
        $sheet->mergeCells('J14:M14'); $sheet->setCellValue('J14', 'Chênh lệch');
        $sheet->mergeCells('N14:P14'); $sheet->setCellValue('N14', 'Phẩm chất');

        $sheet->mergeCells('F15:F16'); $sheet->setCellValue('F15', 'SL');
        $sheet->mergeCells('G15:G16'); $sheet->setCellValue('G15', "Thành\ntiền");
        $sheet->mergeCells('H15:H16'); $sheet->setCellValue('H15', 'SL');
        $sheet->mergeCells('I15:I16'); $sheet->setCellValue('I15', "Thành\ntiền");
        $sheet->mergeCells('J15:K15'); $sheet->setCellValue('J15', 'Thừa');
        $sheet->mergeCells('L15:M15'); $sheet->setCellValue('L15', 'Thiếu');
        $sheet->mergeCells('N15:N16'); $sheet->setCellValue('N15', "Còn tốt\n100%");
        $sheet->mergeCells('O15:O16'); $sheet->setCellValue('O15', "Kém\nphẩm chất");
        $sheet->mergeCells('P15:P16'); $sheet->setCellValue('P15', "Mất\nphẩm chất");

        $sheet->setCellValue('J16', 'SL');
        $sheet->setCellValue('K16', 'TT');
        $sheet->setCellValue('L16', 'SL');
        $sheet->setCellValue('M16', 'TT');

        // Header Styling
        $headerRange = 'A14:P16';
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->setSize(10);
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
        $sheet->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F1F5F9');

        // Data Rows starting at Row 17
        $currentRow = 17;
        foreach ($equipments as $index => $eq) {
            $unit = 'Cái';
            $price = $eq->original_price ?? 0;
            $qty = 1;
            $total = $price * $qty;

            $sheet->setCellValue('A' . $currentRow, $index + 1);
            $sheet->setCellValue('B' . $currentRow, $eq->name);
            $sheet->setCellValue('C' . $currentRow, $eq->asset_code ?? $eq->equipment_code);
            $sheet->setCellValue('D' . $currentRow, $unit);
            $sheet->setCellValue('E' . $currentRow, $price);
            $sheet->setCellValue('F' . $currentRow, $qty);
            $sheet->setCellValue('G' . $currentRow, $total);
            $sheet->setCellValue('H' . $currentRow, $qty);
            $sheet->setCellValue('I' . $currentRow, $total);
            $sheet->setCellValue('J' . $currentRow, '');
            $sheet->setCellValue('K' . $currentRow, '');
            $sheet->setCellValue('L' . $currentRow, '');
            $sheet->setCellValue('M' . $currentRow, '');
            $sheet->setCellValue('N' . $currentRow, $qty);
            $sheet->setCellValue('O' . $currentRow, '');
            $sheet->setCellValue('P' . $currentRow, '');

            // Formatting
            $sheet->getStyle('A' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('C' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('D' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('E' . $currentRow)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('F' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('G' . $currentRow)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('H' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('I' . $currentRow)->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle('N' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $currentRow++;
        }

        // Table Borders
        $tableRange = 'A14:P' . ($currentRow - 1);
        $sheet->getStyle($tableRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('94A3B8');

        // Signature Footer Block
        $sigDateRow = $currentRow + 2;
        $sheet->mergeCells("I$sigDateRow:P$sigDateRow");
        $sheet->setCellValue("I$sigDateRow", "Cần Thơ, ngày " . date('d') . " tháng " . date('m') . " năm " . date('Y'));
        $sheet->getStyle("I$sigDateRow")->getFont()->setItalic(true);
        $sheet->getStyle("I$sigDateRow")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sigTitleRow = $sigDateRow + 1;
        $sheet->mergeCells("B$sigTitleRow:D$sigTitleRow");
        $sheet->setCellValue("B$sigTitleRow", 'Trưởng ban Kiểm kê');
        $sheet->getStyle("B$sigTitleRow")->getFont()->setBold(true);
        $sheet->getStyle("B$sigTitleRow")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("I$sigTitleRow:P$sigTitleRow");
        $sheet->setCellValue("I$sigTitleRow", 'Tổ Kiểm kê');
        $sheet->getStyle("I$sigTitleRow")->getFont()->setBold(true);
        $sheet->getStyle("I$sigTitleRow")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Auto-fit column widths
        foreach (range(1, 16) as $colIndex) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = "BIEN_BAN_KIEM_KE_TAI_SAN_" . date('Ymd_His') . ".xlsx";

        return response()->stream(
            function () use ($writer) {
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control'       => 'max-age=0',
            ]
        );
    }
}
