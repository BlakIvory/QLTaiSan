<?php

namespace App\Enums;

enum ContractStatus: string
{
    case DRAFT   = 'DRAFT';
    case ACTIVE  = 'ACTIVE';
    case EXPIRED = 'EXPIRED';
    case TERMINATED = 'TERMINATED';

    public function label(): string
    {
        return match($this) {
            self::DRAFT      => 'Nháp',
            self::ACTIVE     => 'Đang hiệu lực',
            self::EXPIRED    => 'Hết hạn',
            self::TERMINATED => 'Đã chấm dứt',
        };
    }
}
