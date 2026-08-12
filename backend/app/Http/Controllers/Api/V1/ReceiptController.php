<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\ReceiptItem;
use App\Models\Equipment;
use App\Models\Organization;
use App\Enums\EquipmentStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReceiptController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Receipt::with(['items.equipment', 'equipment', 'fromOrganization', 'toOrganization', 'creator']);

        if ($search = $request->input('search')) {
            $query->where('receipt_code', 'like', "%{$search}%")
                  ->orWhereHas('equipment', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('equipment_code', 'like', "%{$search}%");
                  })
                  ->orWhereHas('items.equipment', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('equipment_code', 'like', "%{$search}%");
                  });
        }

        $receipts = $query->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $receipts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id'         => 'nullable|exists:equipment,id',
            'items'                => 'nullable|array|min:1',
            'items.*.equipment_id' => 'required_with:items|exists:equipment,id',
            'items.*.quantity'     => 'nullable|integer|min:1',
            'items.*.unit'         => 'nullable|string|max:50',
            'items.*.notes'        => 'nullable|string',
            'from_organization_id' => 'nullable|exists:organizations,id',
            'to_organization_id'   => 'required|exists:organizations,id',
            'from_date'            => 'required|date',
            'to_date'              => 'nullable|date|after_or_equal:from_date',
            'receiver_name'        => 'nullable|string|max:255',
            'deliverer_name'       => 'nullable|string|max:255',
            'notes'                => 'nullable|string',
            'attachment'           => 'nullable|file|mimes:pdf,doc,docx,jpg,png,jpeg|max:10240',
        ]);

        $code = 'TN-' . date('Ymd') . '-' . str_pad(Receipt::count() + 1, 4, '0', STR_PAD_LEFT);
        
        $receiptData = [
            'receipt_code'         => $code,
            'from_organization_id' => $validated['from_organization_id'] ?? null,
            'to_organization_id'   => $validated['to_organization_id'],
            'from_date'            => $validated['from_date'],
            'to_date'              => $validated['to_date'] ?? null,
            'receiver_name'        => $validated['receiver_name'] ?? null,
            'deliverer_name'       => $validated['deliverer_name'] ?? null,
            'notes'                => $validated['notes'] ?? null,
            'status'               => 'HANDED_OVER',
            'created_by'           => auth()->id(),
        ];

        // Handle file upload
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('receipts', 'public');
            $receiptData['attachment_path'] = '/storage/' . $path;
            $receiptData['attachment_name'] = $file->getClientOriginalName();
        }

        // Single equipment fallback
        if (!empty($validated['equipment_id'])) {
            $receiptData['equipment_id'] = $validated['equipment_id'];
        }

        $receipt = Receipt::create($receiptData);

        // Process multi-items array
        $itemsToProcess = [];
        if (!empty($validated['items'])) {
            $itemsToProcess = $validated['items'];
        } elseif (!empty($validated['equipment_id'])) {
            $itemsToProcess[] = [
                'equipment_id' => $validated['equipment_id'],
                'quantity'     => 1,
                'unit'         => 'Cái',
                'notes'        => $validated['notes'] ?? '',
            ];
        }

        foreach ($itemsToProcess as $item) {
            ReceiptItem::create([
                'receipt_id'   => $receipt->id,
                'equipment_id' => $item['equipment_id'],
                'quantity'     => $item['quantity'] ?? 1,
                'unit'         => $item['unit'] ?? 'Cái',
                'notes'        => $item['notes'] ?? null,
            ]);

            // Hand over equipment to receiving organization
            $eq = Equipment::find($item['equipment_id']);
            if ($eq) {
                $eq->update([
                    'organization_id' => $validated['to_organization_id'],
                    'status'          => EquipmentStatus::IN_USE->value,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Tạo biên bản Tiếp nhận & Bàn giao thiết bị thành công.',
            'data'    => $receipt->load(['items.equipment', 'equipment', 'fromOrganization', 'toOrganization']),
        ], 201);
    }

    public function uploadAttachment(Request $request, $id): JsonResponse
    {
        $request->validate([
            'attachment' => 'required|file|mimes:pdf,doc,docx,jpg,png,jpeg|max:10240',
        ]);

        $receipt = Receipt::findOrFail($id);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('receipts', 'public');
            
            $receipt->update([
                'attachment_path' => '/storage/' . $path,
                'attachment_name' => $file->getClientOriginalName(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã tải lên tập tin scan biên bản bàn giao thành công!',
            'data'    => $receipt->load(['items.equipment', 'equipment', 'fromOrganization', 'toOrganization']),
        ]);
    }

    public function exportWord($id)
    {
        $receipt = Receipt::with(['items.equipment', 'equipment', 'fromOrganization', 'toOrganization'])->findOrFail($id);

        $fromDate = $receipt->from_date ? Carbon::parse($receipt->from_date)->format('d/m/Y') : date('d/m/Y');
        $toDate = $receipt->to_date ? Carbon::parse($receipt->to_date)->format('d/m/Y') : 'Vô thời hạn';
        $currentDay = date('d');
        $currentMonth = date('m');
        $currentYear = date('Y');

        $deliverer = $receipt->deliverer_name ?: 'Đại diện Phòng Vật tư - TTBYT';
        $receiver = $receipt->receiver_name ?: 'Đại diện Khoa/Phòng tiếp nhận';
        $fromOrgName = $receipt->fromOrganization ? $receipt->fromOrganization->name : 'Phòng Vật tư – Thiết bị y tế';
        $toOrgName = $receipt->toOrganization ? $receipt->toOrganization->name : 'Chưa phân bổ';

        // Prepare table rows for items
        $tableRowsHtml = '';
        $itemsList = $receipt->items->count() > 0 ? $receipt->items : [];

        if (count($itemsList) > 0) {
            foreach ($itemsList as $index => $item) {
                $stt = $index + 1;
                $eq = $item->equipment;
                $eqName = $eq ? htmlspecialchars($eq->name) : 'N/A';
                $eqCode = $eq ? htmlspecialchars($eq->equipment_code) : 'N/A';
                $assetCode = $eq && $eq->asset_code ? htmlspecialchars($eq->asset_code) : 'N/A';
                $modelSerial = ($eq && $eq->model ? "Model: {$eq->model}" : '') . ($eq && $eq->serial_number ? "<br>SN: {$eq->serial_number}" : '');
                $qtyUnit = $item->quantity . ' ' . ($item->unit ?: 'cái');
                $itemNote = htmlspecialchars($item->notes ?: $receipt->notes ?: 'Hoạt động tốt');

                $tableRowsHtml .= "
                <tr>
                    <td style='text-align: center;'>{$stt}</td>
                    <td><strong>{$eqName}</strong></td>
                    <td>{$eqCode}<br><small style='color:#555;'>Mã TS: {$assetCode}</small></td>
                    <td>{$modelSerial}</td>
                    <td style='text-align: center;'><strong>{$qtyUnit}</strong></td>
                    <td>Từ: <strong>{$fromDate}</strong><br>Đến: <strong>{$toDate}</strong></td>
                    <td>{$itemNote}</td>
                </tr>";
            }
        } else {
            // Single equipment fallback
            $eq = $receipt->equipment;
            $eqName = $eq ? htmlspecialchars($eq->name) : 'N/A';
            $eqCode = $eq ? htmlspecialchars($eq->equipment_code) : 'N/A';
            $assetCode = $eq && $eq->asset_code ? htmlspecialchars($eq->asset_code) : 'N/A';
            $modelSerial = ($eq && $eq->model ? "Model: {$eq->model}" : '') . ($eq && $eq->serial_number ? "<br>SN: {$eq->serial_number}" : '');

            $tableRowsHtml = "
            <tr>
                <td style='text-align: center;'>1</td>
                <td><strong>{$eqName}</strong></td>
                <td>{$eqCode}<br><small style='color:#555;'>Mã TS: {$assetCode}</small></td>
                <td>{$modelSerial}</td>
                <td style='text-align: center;'><strong>1 Cái</strong></td>
                <td>Từ: <strong>{$fromDate}</strong><br>Đến: <strong>{$toDate}</strong></td>
                <td>{$receipt->notes}<br><small style='color:green;'>Trạng thái: Hoạt động tốt</small></td>
            </tr>";
        }

        $wordHtml = "
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
        <meta charset='utf-8'>
        <title>BIÊN BẢN BÀN GIAO THIẾT BỊ Y TẾ - {$receipt->receipt_code}</title>
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 20px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .header-table td { border: none; vertical-align: top; text-align: center; font-size: 11pt; }
            .h-left { font-weight: bold; text-transform: uppercase; }
            .h-right { font-weight: bold; }
            .title { text-align: center; font-weight: bold; font-size: 16pt; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
            .sub-title { text-align: center; font-style: italic; font-size: 12pt; margin-bottom: 20px; }
            .info-block { margin-bottom: 15px; font-size: 13pt; }
            .section-header { font-weight: bold; margin-top: 15px; margin-bottom: 5px; font-size: 13pt; }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
            .data-table th, .data-table td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; text-align: left; }
            .data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
            .sig-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
            .sig-table td { border: none; text-align: center; vertical-align: top; width: 50%; font-size: 12pt; }
            .sig-title { font-weight: bold; text-transform: uppercase; }
            .sig-note { font-style: italic; font-size: 11pt; margin-bottom: 60px; }
        </style>
        </head>
        <body>
            <table class='header-table'>
                <tr>
                    <td style='width: 45%;'>
                        <div class='h-left'>BỆNH VIỆN ĐA KHOA HÒA HẢO<br>MEDIC CẦN THƠ</div>
                        <div style='font-size: 10pt; font-style: italic;'>PHÒNG VẬT TƯ – THIẾT BỊ Y TẾ</div>
                    </td>
                    <td style='width: 55%;'>
                        <div class='h-right'>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style='font-weight: bold;'>Độc lập - Tự do - Hạnh phúc</div>
                        <div>-------------------</div>
                    </td>
                </tr>
            </table>

            <div class='title'>BIÊN BẢN BÀN GIAO VÀ TIẾP NHẬN<br>TRANG THIẾT BỊ Y TẾ</div>
            <div class='sub-title'>Mã số biên bản: <strong>{$receipt->receipt_code}</strong></div>

            <div class='info-block'>
                Hôm nay, ngày {$currentDay} tháng {$currentMonth} năm {$currentYear}, tại Phòng Vật tư – Thiết bị y tế, Bệnh viện Đa khoa Hòa Hảo - Medic Cần Thơ, chúng tôi tiến hành bàn giao và tiếp nhận trang thiết bị y tế gồm các bên sau:
            </div>

            <div class='section-header'>I. BÊN GIAO (Đại diện Phòng CSVC / Vật tư - TTBYT):</div>
            <table style='width: 100%; margin-left: 15px; margin-bottom: 10px;'>
                <tr><td style='width: 130px;'><strong>Họ và tên:</strong></td><td>{$deliverer}</td></tr>
                <tr><td><strong>Chức vụ / Đơn vị:</strong></td><td>{$fromOrgName}</td></tr>
            </table>

            <div class='section-header'>II. BÊN NHẬN (Đơn vị tiếp nhận quản lý & sử dụng):</div>
            <table style='width: 100%; margin-left: 15px; margin-bottom: 10px;'>
                <tr><td style='width: 130px;'><strong>Họ và tên:</strong></td><td>{$receiver}</td></tr>
                <tr><td><strong>Đơn vị tiếp nhận:</strong></td><td><strong>{$toOrgName}</strong></td></tr>
            </table>

            <div class='section-header'>III. DANH MỤC THIẾT BỊ BÀN GIAO:</div>
            <table class='data-table'>
                <thead>
                    <tr>
                        <th style='width: 4%; text-align: center;'>STT</th>
                        <th style='width: 25%;'>Tên thiết bị y tế</th>
                        <th style='width: 15%;'>Mã quản lý</th>
                        <th style='width: 15%;'>Model / Serial</th>
                        <th style='width: 11%; text-align: center;'>Số lượng</th>
                        <th style='width: 15%;'>Thời gian bàn giao</th>
                        <th style='width: 15%;'>Ghi chú / Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {$tableRowsHtml}
                </tbody>
            </table>

            <div class='section-header'>IV. CAM KẾT CỦA CÁC BÊN:</div>
            <div style='margin-left: 15px; margin-bottom: 20px;'>
                1. Bên nhận đã kiểm tra thực tế, thiết bị đầy đủ phụ kiện kèm theo và hoạt động ổn định.<br>
                2. Bên nhận có trách nhiệm bảo quản, khai thác sử dụng đúng quy trình vận hành và tuân thủ các quy định quản lý trang thiết bị y tế của Bệnh viện.<br>
                3. Biên bản này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để làm căn cứ theo dõi và quản lý.
            </div>

            <table class='sig-table'>
                <tr>
                    <td>
                        <div class='sig-title'>ĐẠI DIỆN BÊN NHẬN</div>
                        <div class='sig-note'>(Ký, dán tem/ghi rõ họ tên)</div>
                        <br><br><br>
                        <div><strong>{$receiver}</strong></div>
                    </td>
                    <td>
                        <div class='sig-title'>ĐẠI DIỆN BÊN GIAO</div>
                        <div class='sig-note'>(Ký, dán tem/ghi rõ họ tên)</div>
                        <br><br><br>
                        <div><strong>{$deliverer}</strong></div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        ";

        return response($wordHtml, 200, [
            'Content-Type'        => 'application/msword; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="Bien_ban_ban_giao_' . $receipt->receipt_code . '.doc"',
        ]);
    }

    public function show($id): JsonResponse
    {
        $receipt = Receipt::with(['items.equipment', 'equipment', 'fromOrganization', 'toOrganization', 'creator'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $receipt,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $receipt = Receipt::findOrFail($id);
        $receipt->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa biên bản tiếp nhận thành công.',
        ]);
    }
}
