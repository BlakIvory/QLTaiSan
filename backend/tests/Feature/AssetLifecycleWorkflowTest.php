<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\EquipmentGroup;
use App\Models\EquipmentType;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssetLifecycleWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_errors_are_returned_in_vietnamese(): void
    {
        $this->getJson('/api/v1/receipts')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Vui lòng đăng nhập để tiếp tục.');

        $user = User::factory()->create(['is_active' => true]);
        Sanctum::actingAs($user);
        $this->postJson('/api/v1/allocations', [])
            ->assertUnprocessable()
            ->assertJsonPath('errors.from_organization_id.0', 'Vui lòng nhập kho nguồn.')
            ->assertJsonPath('errors.items.0', 'Vui lòng nhập danh sách tài sản.');
    }

    public function test_asset_moves_only_at_confirmed_handover_steps(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        Sanctum::actingAs($user);

        $warehouse = Organization::create(['code' => 'WH', 'name' => 'Kho', 'type' => 'WAREHOUSE', 'is_active' => true]);
        $deptA = Organization::create(['code' => 'A', 'name' => 'Khoa A', 'type' => 'DEPARTMENT', 'is_active' => true]);
        $deptB = Organization::create(['code' => 'B', 'name' => 'Khoa B', 'type' => 'DEPARTMENT', 'is_active' => true]);
        $group = EquipmentGroup::create(['code' => 'G', 'name' => 'Nhóm', 'is_active' => true]);
        $type = EquipmentType::create(['code' => 'T', 'name' => 'Loại', 'equipment_group_id' => $group->id, 'is_active' => true]);
        $equipment = Equipment::create(['equipment_code' => 'TB-TEST', 'name' => 'Máy thử', 'equipment_type_id' => $type->id, 'organization_id' => $warehouse->id, 'status' => 'PENDING_RECEIPT', 'importance_level' => 'MEDIUM']);

        $receiptId = $this->postJson('/api/v1/receipts', [
            'invoice_number' => 'HD-001', 'invoice_date' => '2026-08-18', 'receipt_date' => '2026-08-18',
            'organization_id' => $warehouse->id, 'items' => [['equipment_id' => $equipment->id, 'quantity' => 1, 'unit' => 'Cái']],
        ])->assertCreated()->json('data.id');
        $this->assertSame('PENDING_RECEIPT', $equipment->fresh()->status->value);
        $this->putJson("/api/v1/receipts/{$receiptId}", [
            'invoice_number' => 'HD-001-UPDATED', 'invoice_date' => '2026-08-18', 'receipt_date' => '2026-08-18',
            'organization_id' => $warehouse->id, 'items' => [['equipment_id' => $equipment->id, 'quantity' => 1, 'unit' => 'Cái']],
        ])->assertOk()->assertJsonPath('data.invoice_number', 'HD-001-UPDATED');
        $this->postJson("/api/v1/receipts/{$receiptId}/confirm")->assertOk();
        $this->assertSame('IN_STOCK', $equipment->fresh()->status->value);
        $this->putJson("/api/v1/receipts/{$receiptId}", [
            'invoice_number' => 'SHOULD-FAIL', 'invoice_date' => '2026-08-18', 'receipt_date' => '2026-08-18',
            'organization_id' => $warehouse->id, 'items' => [['equipment_id' => $equipment->id]],
        ])->assertStatus(422);

        $allocationId = $this->postJson('/api/v1/allocations', [
            'from_organization_id' => $warehouse->id, 'to_organization_id' => $deptA->id,
            'allocation_date' => '2026-08-18', 'items' => [['equipment_id' => $equipment->id]],
        ])->assertCreated()->json('data.id');
        $this->assertSame($warehouse->id, $equipment->fresh()->organization_id);
        $this->postJson("/api/v1/allocations/{$allocationId}/confirm")->assertOk();
        $this->assertSame($warehouse->id, $equipment->fresh()->organization_id);
        $this->postJson("/api/v1/allocations/{$allocationId}/handover")->assertOk();
        $this->assertSame($deptA->id, $equipment->fresh()->organization_id);

        $transferId = $this->postJson('/api/v1/transfers', [
            'equipment_id' => $equipment->id, 'to_organization_id' => $deptB->id,
            'reason' => 'Điều chuyển sử dụng', 'requested_date' => '2026-08-18',
        ])->assertCreated()->json('data.id');
        $this->assertSame($deptA->id, $equipment->fresh()->organization_id);
        $this->postJson("/api/v1/transfers/{$transferId}/approve")->assertOk();
        $this->postJson("/api/v1/transfers/{$transferId}/handover")->assertOk();
        $this->assertSame($deptA->id, $equipment->fresh()->organization_id);
        $this->postJson("/api/v1/transfers/{$transferId}/complete")->assertOk();
        $this->assertSame($deptB->id, $equipment->fresh()->organization_id);
        $this->assertSame('IN_USE', $equipment->fresh()->status->value);
    }
}
