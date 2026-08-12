<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentType extends Model
{
    protected $guarded = [];

    public function equipmentGroup(): BelongsTo
    {
        return $this->belongsTo(EquipmentGroup::class);
    }
}
