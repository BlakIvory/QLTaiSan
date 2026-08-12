<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $guarded = [];

    protected $casts = [
        'from_date' => 'date:Y-m-d',
        'to_date'   => 'date:Y-m-d',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function items()
    {
        return $this->hasMany(ReceiptItem::class)->with('equipment');
    }

    public function fromOrganization()
    {
        return $this->belongsTo(Organization::class, 'from_organization_id');
    }

    public function toOrganization()
    {
        return $this->belongsTo(Organization::class, 'to_organization_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
