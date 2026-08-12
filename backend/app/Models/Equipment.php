<?php

namespace App\Models;

use App\Enums\EquipmentStatus;
use App\Enums\ImportanceLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipment extends Model
{
    use SoftDeletes;

    protected $table = 'equipment';

    protected $fillable = [
        'equipment_code', 'asset_code', 'name', 'equipment_type_id',
        'model', 'serial', 'manufacturer_id', 'country_id',
        'year_of_manufacture', 'purchase_date', 'in_use_date',
        'original_price', 'current_value', 'funding_source_id',
        'supplier_id', 'contract_number', 'warranty_start', 'warranty_end',
        'organization_id', 'location_id', 'responsible_user_id',
        'status', 'importance_level',
        'requires_maintenance', 'requires_inspection',
        'maintenance_cycle_days', 'inspection_cycle_days',
        'last_maintenance_date', 'next_maintenance_date',
        'last_inspection_date', 'next_inspection_date',
        'qr_code', 'notes', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'purchase_date'          => 'date',
        'in_use_date'            => 'date',
        'warranty_start'         => 'date',
        'warranty_end'           => 'date',
        'last_maintenance_date'  => 'date',
        'next_maintenance_date'  => 'date',
        'last_inspection_date'   => 'date',
        'next_inspection_date'   => 'date',
        'original_price'         => 'decimal:2',
        'current_value'          => 'decimal:2',
        'requires_maintenance'   => 'boolean',
        'requires_inspection'    => 'boolean',
        'status'                 => EquipmentStatus::class,
        'importance_level'       => ImportanceLevel::class,
    ];

    // Relationships
    public function equipmentType()   { return $this->belongsTo(EquipmentType::class); }
    public function manufacturer()    { return $this->belongsTo(Manufacturer::class); }
    public function country()         { return $this->belongsTo(Country::class); }
    public function fundingSource()   { return $this->belongsTo(FundingSource::class); }
    public function supplier()        { return $this->belongsTo(Supplier::class); }
    public function organization()    { return $this->belongsTo(Organization::class); }
    public function location()        { return $this->belongsTo(Location::class); }
    public function responsibleUser() { return $this->belongsTo(User::class, 'responsible_user_id'); }
    public function createdBy()       { return $this->belongsTo(User::class, 'created_by'); }

    public function images()          { return $this->hasMany(EquipmentImage::class); }
    public function primaryImage()    { return $this->hasOne(EquipmentImage::class)->where('is_primary', true); }
    public function statusHistories() { return $this->hasMany(EquipmentStatusHistory::class)->orderByDesc('changed_at'); }
    public function locationHistories(){ return $this->hasMany(EquipmentLocationHistory::class)->orderByDesc('changed_at'); }
    public function damageReports()   { return $this->hasMany(DamageReport::class); }
    public function repairs()         { return $this->hasMany(Repair::class); }
    public function maintenancePlans(){ return $this->hasMany(MaintenancePlan::class); }
    public function inspections()     { return $this->hasMany(Inspection::class); }
    public function attachments()     { return $this->morphMany(Attachment::class, 'attachable'); }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [
            EquipmentStatus::LIQUIDATED->value,
            EquipmentStatus::DESTROYED->value,
        ]);
    }

    public function scopeByOrganization($query, $orgId)
    {
        return $query->where('organization_id', $orgId);
    }

    public function scopeWarrantyExpiringSoon($query, int $days = 30)
    {
        return $query->whereBetween('warranty_end', [now(), now()->addDays($days)]);
    }

    public function scopeMaintenanceOverdue($query)
    {
        return $query->where('requires_maintenance', true)
                     ->whereNotNull('next_maintenance_date')
                     ->where('next_maintenance_date', '<', now()->toDateString());
    }

    // Business logic
    public function canTransitionTo(EquipmentStatus $newStatus): bool
    {
        return $this->status->canTransitionTo($newStatus);
    }

    public function isLiquidated(): bool
    {
        return in_array($this->status, [EquipmentStatus::LIQUIDATED, EquipmentStatus::DESTROYED]);
    }

    public function isAvailableForLoan(): bool
    {
        return in_array($this->status, [
            EquipmentStatus::AVAILABLE,
            EquipmentStatus::IN_USE,
        ]);
    }
}
