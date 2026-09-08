<?php
require __DIR__ . '/../../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ProposalDocument;
use App\Models\PurchaseRequestSummary;
use App\Models\PurchaseRequest;
use App\Models\Transfer;
use App\Models\Equipment;
use App\Models\Organization;
use App\Models\User;

$pvtUser = User::where('email', 'pvt@hospital.local')->first() ?? User::first();
$deptUser = User::where('email', 'dept@hospital.local')->first() ?? User::first();
$summary = PurchaseRequestSummary::first();
if (!$summary) {
    $summary = PurchaseRequestSummary::create([
        'code' => 'TH-TEST-001',
        'title' => 'Tổng hợp nhu cầu mua sắm đợt 1',
        'status' => 'PENDING',
        'created_by' => $pvtUser->id,
    ]);
}

// 1. Reset TT-UNHAPPY-TEST
$p = ProposalDocument::where('code', 'TT-UNHAPPY-TEST')->first();
if ($p) {
    $p->update([
        'status' => 'SUBMITTED',
        'board_notes' => null,
        'approved_by' => null,
        'approved_at' => null,
    ]);
} else {
    ProposalDocument::create([
        'code' => 'TT-UNHAPPY-TEST',
        'title' => 'Tờ trình mua sắm máy thở cấp cứu cho Khoa Cấp cứu',
        'summary_id' => $summary->id,
        'proposal_date' => now()->toDateString(),
        'total_amount' => 450000000,
        'content' => 'Kính trình BGĐ phê duyệt kế hoạch mua sắm thiết bị',
        'status' => 'SUBMITTED',
        'submitted_by' => $pvtUser->id,
        'submitted_at' => now(),
        'created_by' => $pvtUser->id,
    ]);
}
echo "Proposal TT-UNHAPPY-TEST set to SUBMITTED\n";

// 2. Reset DC-UNHAPPY-TEST
$eq = Equipment::first();
$fromOrg = Organization::where('code', 'K-NOI-TONG-HOP')->first() ?? Organization::first();
$toOrg = Organization::where('code', 'K-NGOAI-TONG-HOP')->first() ?? Organization::find(2);

$t = Transfer::where('code', 'DC-UNHAPPY-TEST')->first();
if ($t) {
    $t->update([
        'status' => 'PENDING',
        'notes' => null,
        'approved_by' => null,
        'approved_at' => null,
    ]);
} else {
    Transfer::create([
        'code' => 'DC-UNHAPPY-TEST',
        'equipment_id' => $eq ? $eq->id : 1,
        'from_organization_id' => $fromOrg->id,
        'to_organization_id' => $toOrg->id,
        'reason' => 'Điều chuyển phục vụ công tác cấp cứu',
        'status' => 'PENDING',
        'created_by' => $pvtUser->id,
        'requested_date' => now()->toDateString(),
    ]);
}
echo "Transfer DC-UNHAPPY-TEST set to PENDING\n";

// 3. Reset DM-UNHAPPY-RECALL
$pr = PurchaseRequest::where('code', 'DM-UNHAPPY-RECALL')->first();
if ($pr) {
    $pr->update([
        'status' => 'SUBMITTED',
        'summary_id' => null,
    ]);
} else {
    PurchaseRequest::create([
        'code' => 'DM-UNHAPPY-RECALL',
        'item_name' => 'Máy đo SpO2 cầm tay khoa Nội',
        'organization_id' => $fromOrg->id,
        'quantity' => 2,
        'unit' => 'Bộ',
        'priority' => 'NORMAL',
        'reason' => 'Kiểm thử luồng rút lại đề nghị mua sắm',
        'status' => 'SUBMITTED',
        'requester_id' => $deptUser->id,
        'created_by' => $deptUser->id,
    ]);
}
echo "PurchaseRequest DM-UNHAPPY-RECALL set to SUBMITTED\n";
