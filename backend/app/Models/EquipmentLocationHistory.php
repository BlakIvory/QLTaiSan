<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentLocationHistory extends Model
{
    protected $guarded = [];

    public $timestamps = false;

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function equipment()       { return $this->belongsTo(Equipment::class); }
    public function fromOrganization() { return $this->belongsTo(Organization::class, 'from_organization_id'); }
    public function toOrganization()  { return $this->belongsTo(Organization::class, 'to_organization_id'); }
    public function changedBy()       { return $this->belongsTo(User::class, 'changed_by'); }
}
