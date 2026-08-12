<?php

namespace App\Enums;

enum LiquidationStatus: string
{
    case PENDING  = 'PENDING';
    case APPROVED = 'APPROVED';
    case REJECTED = 'REJECTED';
    case COMPLETED = 'COMPLETED';

    public function label(): string
    {
        return match($this) {
            self::PENDING   => 'Chờ phê duyệt',
            self::APPROVED  => 'Đã phê duyệt',
            self::REJECTED  => 'Đã từ chối',
            self::COMPLETED => 'Hoàn thành',
        };
    }
}
