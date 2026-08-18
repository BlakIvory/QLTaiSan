<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transfer extends Model
{
    use SoftDeletes;

    protected $guarded = [];
    protected $casts = [
        'requested_date' => 'date:Y-m-d',
        'approved_at' => 'datetime',
        'executed_date' => 'date:Y-m-d',
    ];

    public function equipment() { return $this->belongsTo(Equipment::class); }
    public function fromOrganization() { return $this->belongsTo(Organization::class, 'from_organization_id'); }
    public function toOrganization() { return $this->belongsTo(Organization::class, 'to_organization_id'); }
    public function fromLocation() { return $this->belongsTo(Location::class, 'from_location_id'); }
    public function toLocation() { return $this->belongsTo(Location::class, 'to_location_id'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}
