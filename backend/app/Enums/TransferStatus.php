<?php

namespace App\Enums;

enum TransferStatus: string
{
    case DRAFT     = 'DRAFT';
    case PENDING   = 'PENDING';
    case APPROVED  = 'APPROVED';
    case REJECTED  = 'REJECTED';
    case WAITING_DELIVERY = 'WAITING_DELIVERY';
    case DELIVERED = 'DELIVERED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    public function label(): string
    {
        return match($this) {
            self::DRAFT            => 'Nháp',
            self::PENDING          => 'Chờ phê duyệt',
            self::APPROVED         => 'Đã phê duyệt',
            self::REJECTED         => 'Đã từ chối',
            self::WAITING_DELIVERY => 'Chờ bàn giao',
            self::DELIVERED        => 'Đã bàn giao',
            self::COMPLETED        => 'Hoàn thành',
            self::CANCELLED        => 'Đã hủy',
        };
    }
}
