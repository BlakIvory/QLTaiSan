<?php

namespace App\Enums;

enum OrganizationType: string
{
    case HOSPITAL     = 'HOSPITAL';
    case CAMPUS       = 'CAMPUS';
    case BLOCK        = 'BLOCK';
    case DEPARTMENT   = 'DEPARTMENT';
    case ROOM         = 'ROOM';
    case WAREHOUSE    = 'WAREHOUSE';

    public function label(): string
    {
        return match($this) {
            self::HOSPITAL   => 'Bệnh viện',
            self::CAMPUS     => 'Cơ sở',
            self::BLOCK      => 'Khối',
            self::DEPARTMENT => 'Khoa',
            self::ROOM       => 'Phòng',
            self::WAREHOUSE  => 'Kho',
        };
    }
}
