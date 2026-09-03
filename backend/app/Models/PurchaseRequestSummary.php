<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequestSummary extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'summary_date'    => 'date',
        'total_estimated' => 'decimal:2',
    ];

    public function requests()   { return $this->hasMany(PurchaseRequest::class, 'summary_id'); }
    public function proposals()  { return $this->hasMany(ProposalDocument::class, 'summary_id'); }
    public function createdBy()  { return $this->belongsTo(User::class, 'created_by'); }
}
