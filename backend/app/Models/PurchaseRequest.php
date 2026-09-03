<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequest extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'needed_by'       => 'date',
        'estimated_price' => 'decimal:2',
        'estimated_total' => 'decimal:2',
    ];

    public function requester()    { return $this->belongsTo(User::class, 'requester_id'); }
    public function organization() { return $this->belongsTo(Organization::class); }
    public function summary()      { return $this->belongsTo(PurchaseRequestSummary::class, 'summary_id'); }
    public function createdBy()    { return $this->belongsTo(User::class, 'created_by'); }
}
