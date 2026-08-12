<?php

namespace App\Enums;

enum ImportanceLevel: string
{
    case LOW      = 'LOW';
    case MEDIUM   = 'MEDIUM';
    case HIGH     = 'HIGH';
    case CRITICAL = 'CRITICAL';

    public function label(): string
    {
        return match($this) {
            self::LOW      => 'Thấp',
            self::MEDIUM   => 'Trung bình',
            self::HIGH     => 'Cao',
            self::CRITICAL => 'Thiết yếu',
        };
    }
}
