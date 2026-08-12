<?php

namespace App\Enums;

enum DamageReportStatus: string
{
    case NEW        = 'NEW';
    case ASSIGNED   = 'ASSIGNED';
    case IN_REPAIR  = 'IN_REPAIR';
    case RESOLVED   = 'RESOLVED';
    case CLOSED     = 'CLOSED';

    public function label(): string
    {
        return match($this) {
            self::NEW       => 'Mới báo',
            self::ASSIGNED  => 'Đã giao kỹ thuật',
            self::IN_REPAIR => 'Đang sửa chữa',
            self::RESOLVED  => 'Đã giải quyết',
            self::CLOSED    => 'Đã đóng',
        };
    }
}
