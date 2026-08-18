<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Allocation extends Model
{
    use SoftDeletes;

    protected $guarded = [];
    protected $casts = ['allocation_date' => 'date:Y-m-d'];

    public function items() { return $this->hasMany(AllocationItem::class)->with('equipment'); }
    public function fromOrganization() { return $this->belongsTo(Organization::class, 'from_organization_id'); }
    public function toOrganization() { return $this->belongsTo(Organization::class, 'to_organization_id'); }
    public function issuer() { return $this->belongsTo(User::class, 'issued_by'); }
    public function receiver() { return $this->belongsTo(User::class, 'received_by'); }
}
