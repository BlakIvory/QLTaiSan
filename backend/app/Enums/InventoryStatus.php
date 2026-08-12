<?php

namespace App\Enums;

enum InventoryStatus: string
{
    case DRAFT      = 'DRAFT';
    case IN_PROGRESS = 'IN_PROGRESS';
    case COMPLETED  = 'COMPLETED';
    case CLOSED     = 'CLOSED';

    public function label(): string
    {
        return match($this) {
            self::DRAFT       => 'Nháp',
            self::IN_PROGRESS => 'Đang thực hiện',
            self::COMPLETED   => 'Hoàn thành',
            self::CLOSED      => 'Đã đóng',
        };
    }
}
