<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptItem extends Model
{
    protected $guarded = [];

    public function receipt()
    {
        return $this->belongsTo(Receipt::class);
    }

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }
}
