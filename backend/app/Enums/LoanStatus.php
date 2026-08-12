<?php

namespace App\Enums;

enum LoanStatus: string
{
    case PENDING   = 'PENDING';
    case ACTIVE    = 'ACTIVE';
    case RETURNED  = 'RETURNED';
    case OVERDUE   = 'OVERDUE';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match($this) {
            self::PENDING   => 'Chờ xử lý',
            self::ACTIVE    => 'Đang mượn',
            self::RETURNED  => 'Đã trả',
            self::OVERDUE   => 'Quá hạn',
            self::CANCELLED => 'Đã hủy',
        };
    }
}
