<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentGroup extends Model
{
    protected $guarded = [];

    public function equipmentTypes(): HasMany
    {
        return $this->hasMany(EquipmentType::class);
    }
}
