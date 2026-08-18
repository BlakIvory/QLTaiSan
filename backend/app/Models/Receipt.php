<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Receipt extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'receipt_date' => 'date:Y-m-d',
        'invoice_date' => 'date:Y-m-d',
        'total_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(ReceiptItem::class)->with('equipment');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
