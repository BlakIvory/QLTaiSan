<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'name', 'type', 'parent_id', 'path', 'level',
        'phone', 'address', 'description', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'level'     => 'integer',
    ];

    protected static function booted()
    {
        static::saving(function ($org) {
            if ($org->parent_id) {
                $parent = Organization::find($org->parent_id);
                if ($parent) {
                    $org->level = $parent->level + 1;
                    $org->path = $parent->path ? "{$parent->path}/{$org->id}" : "/{$parent->id}/{$org->id}";
                }
            } else {
                $org->level = 0;
                $org->path = "/{$org->id}";
            }
        });
    }

    public function parent()       { return $this->belongsTo(Organization::class, 'parent_id'); }
    public function children()     { return $this->hasMany(Organization::class, 'parent_id'); }
    public function locations()    { return $this->hasMany(Location::class); }
    public function users()        { return $this->hasMany(User::class); }
    public function equipment()    { return $this->hasMany(Equipment::class); }

    public function ancestors()
    {
        return $this->parent ? array_merge($this->parent->ancestors(), [$this->parent]) : [];
    }

    public function scopeActive($query) { return $query->where('is_active', true); }
    public function typeLabel(): string
    {
        $labels = [
            'HOSPITAL' => 'Bệnh viện', 'CAMPUS' => 'Cơ sở', 'BLOCK' => 'Khối',
            'DEPARTMENT' => 'Khoa', 'ROOM' => 'Phòng', 'WAREHOUSE' => 'Kho',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
