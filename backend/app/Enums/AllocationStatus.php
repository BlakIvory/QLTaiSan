<?php

namespace App\Enums;

enum AllocationStatus: string
{
    case DRAFT     = 'DRAFT';
    case PENDING   = 'PENDING';
    case CONFIRMED = 'CONFIRMED';
    case DELIVERED = 'DELIVERED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match($this) {
            self::DRAFT     => 'Nháp',
            self::PENDING   => 'Chờ xác nhận',
            self::CONFIRMED => 'Đã xác nhận',
            self::DELIVERED => 'Đã bàn giao',
            self::COMPLETED => 'Hoàn thành',
            self::CANCELLED => 'Đã hủy',
        };
    }
}
