<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProposalDocument extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'proposal_date' => 'date',
        'submitted_at'  => 'datetime',
        'approved_at'   => 'datetime',
        'total_amount'  => 'decimal:2',
    ];

    public function summary()      { return $this->belongsTo(PurchaseRequestSummary::class, 'summary_id'); }
    public function submittedBy()  { return $this->belongsTo(User::class, 'submitted_by'); }
    public function approvedBy()   { return $this->belongsTo(User::class, 'approved_by'); }
    public function createdBy()    { return $this->belongsTo(User::class, 'created_by'); }
}
