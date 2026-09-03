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

class AssetLifecycleBranchTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Organization $warehouse;
    private Organization $deptA;
    private Organization $deptB;
    private EquipmentType $type;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['is_active' => true]);
        Sanctum::actingAs($this->user);
        $this->warehouse = Organization::create(['code' => 'WH', 'name' => 'Kho', 'type' => 'WAREHOUSE', 'is_active' => true]);
        $this->deptA = Organization::create(['code' => 'A', 'name' => 'Khoa A', 'type' => 'DEPARTMENT', 'is_active' => true]);
        $this->deptB = Organization::create(['code' => 'B', 'name' => 'Khoa B', 'type' => 'DEPARTMENT', 'is_active' => true]);
        $group = EquipmentGroup::create(['code' => 'G', 'name' => 'Nhóm', 'is_active' => true]);
        $this->type = EquipmentType::create(['code' => 'T', 'name' => 'Loại', 'equipment_group_id' => $group->id, 'is_active' => true]);
    }

    private function equipment(array $overrides = []): Equipment
    {
        return Equipment::create(array_merge([
            'equipment_code' => 'TB-' . uniqid(), 'name' => 'Khăn tắm', 'tracking_mode' => 'QUANTITY',
            'quantity' => 8, 'unit' => 'Cái', 'equipment_type_id' => $this->type->id,
            'organization_id' => $this->warehouse->id, 'status' => 'IN_STOCK', 'importance_level' => 'MEDIUM',
        ], $overrides));
    }

    public function test_receipt_rejects_invalid_quantity_and_invalid_state_transitions(): void
    {
        $individual = $this->equipment(['tracking_mode' => 'INDIVIDUAL', 'quantity' => 1, 'status' => 'PENDING_RECEIPT']);
        $payload = [
            'invoice_number' => 'HD-01', 'invoice_date' => '2026-08-30', 'receipt_date' => '2026-08-30',
            'organization_id' => $this->warehouse->id,
            'items' => [['equipment_id' => $individual->id, 'quantity' => 2, 'unit' => 'Cái']],
        ];
        $this->postJson('/api/v1/receipts', $payload)->assertUnprocessable();

        $payload['items'][0]['quantity'] = 1;
        $receiptId = $this->postJson('/api/v1/receipts', $payload)->assertCreated()->json('data.id');
        $this->postJson("/api/v1/receipts/{$receiptId}/confirm")->assertOk();
        $this->postJson("/api/v1/receipts/{$receiptId}/confirm")->assertUnprocessable();
        $this->deleteJson("/api/v1/receipts/{$receiptId}")->assertUnprocessable();
    }

    public function test_allocation_rejects_wrong_source_excess_quantity_and_wrong_order(): void
    {
        $equipment = $this->equipment();
        $base = ['from_organization_id' => $this->warehouse->id, 'to_organization_id' => $this->deptA->id, 'allocation_date' => '2026-08-30'];

        $this->postJson('/api/v1/allocations', $base + ['items' => [['equipment_id' => $equipment->id, 'quantity' => 9]]])->assertUnprocessable();
        $this->postJson('/api/v1/allocations', array_merge($base, ['from_organization_id' => $this->deptB->id, 'items' => [['equipment_id' => $equipment->id, 'quantity' => 2]]]))->assertUnprocessable();
        $this->postJson('/api/v1/allocations', array_merge($base, ['to_organization_id' => $this->warehouse->id, 'items' => [['equipment_id' => $equipment->id, 'quantity' => 2]]]))->assertUnprocessable();

        $allocationId = $this->postJson('/api/v1/allocations', $base + ['items' => [['equipment_id' => $equipment->id, 'quantity' => 2]]])->assertCreated()->json('data.id');
        $this->postJson("/api/v1/allocations/{$allocationId}/handover")->assertUnprocessable();
        $this->postJson("/api/v1/allocations/{$allocationId}/confirm")->assertOk();
        $this->deleteJson("/api/v1/allocations/{$allocationId}")->assertUnprocessable();
    }

    public function test_transfer_rejects_invalid_destination_duplicate_and_wrong_order(): void
    {
        $equipment = $this->equipment(['organization_id' => $this->deptA->id, 'status' => 'IN_USE', 'quantity' => 2]);
        $payload = ['equipment_id' => $equipment->id, 'to_organization_id' => $this->deptB->id, 'reason' => 'Nhu cầu sử dụng', 'requested_date' => '2026-08-30'];

        $this->postJson('/api/v1/transfers', array_merge($payload, ['to_organization_id' => $this->deptA->id]))->assertUnprocessable();
        $transferId = $this->postJson('/api/v1/transfers', $payload)
            ->assertCreated()
            ->assertJsonPath('data.from_organization_id', $this->deptA->id)
            ->json('data.id');
        $this->postJson('/api/v1/transfers', $payload)->assertUnprocessable();
        $this->postJson("/api/v1/transfers/{$transferId}/handover")->assertUnprocessable();
        $this->postJson("/api/v1/transfers/{$transferId}/complete")->assertUnprocessable();
        $this->postJson("/api/v1/transfers/{$transferId}/approve")->assertOk();
        $this->postJson("/api/v1/transfers/{$transferId}/approve")->assertUnprocessable();
        $this->postJson("/api/v1/transfers/{$transferId}/handover")->assertOk();
        $this->assertSame($this->deptA->id, $equipment->fresh()->organization_id);
        $this->postJson("/api/v1/transfers/{$transferId}/complete")->assertOk();
        $this->assertSame($this->deptB->id, $equipment->fresh()->organization_id);
    }

    public function test_rejected_transfer_does_not_move_asset_and_unassigned_asset_cannot_transfer(): void
    {
        $equipment = $this->equipment(['organization_id' => $this->deptA->id, 'status' => 'IN_USE']);
        $payload = ['equipment_id' => $equipment->id, 'to_organization_id' => $this->deptB->id, 'reason' => 'Thử nhánh từ chối', 'requested_date' => '2026-08-30'];
        $transferId = $this->postJson('/api/v1/transfers', $payload)->assertCreated()->json('data.id');
        $this->postJson("/api/v1/transfers/{$transferId}/reject", [])->assertUnprocessable();
        $this->postJson("/api/v1/transfers/{$transferId}/reject", ['notes' => 'Không phù hợp'])->assertOk();
        $this->assertSame($this->deptA->id, $equipment->fresh()->organization_id);
        $this->postJson("/api/v1/transfers/{$transferId}/approve")->assertUnprocessable();

        $unassigned = $this->equipment(['organization_id' => null]);
        $this->postJson('/api/v1/transfers', array_merge($payload, ['equipment_id' => $unassigned->id]))->assertUnprocessable();
    }
}
