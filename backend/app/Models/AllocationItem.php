<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AllocationItem extends Model
{
    protected $guarded = [];

    public function allocation() { return $this->belongsTo(Allocation::class); }
    public function equipment() { return $this->belongsTo(Equipment::class); }
}
