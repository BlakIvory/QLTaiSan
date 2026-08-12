<?php

namespace App\Enums;

enum EquipmentStatus: string
{
    case PENDING_RECEIPT        = 'PENDING_RECEIPT';
    case IN_STOCK               = 'IN_STOCK';
    case AVAILABLE              = 'AVAILABLE';
    case IN_USE                 = 'IN_USE';
    case TEMPORARILY_SUSPENDED  = 'TEMPORARILY_SUSPENDED';
    case UNDER_MAINTENANCE      = 'UNDER_MAINTENANCE';
    case UNDER_REPAIR           = 'UNDER_REPAIR';
    case WAITING_FOR_PARTS      = 'WAITING_FOR_PARTS';
    case UNDER_INSPECTION       = 'UNDER_INSPECTION';
    case ON_LOAN                = 'ON_LOAN';
    case RECALLED               = 'RECALLED';
    case BROKEN_BEYOND_REPAIR   = 'BROKEN_BEYOND_REPAIR';
    case LOST                   = 'LOST';
    case PENDING_LIQUIDATION    = 'PENDING_LIQUIDATION';
    case LIQUIDATED             = 'LIQUIDATED';
    case DESTROYED              = 'DESTROYED';

    public function label(): string
    {
        return match($this) {
            self::PENDING_RECEIPT       => 'Chờ tiếp nhận',
            self::IN_STOCK              => 'Trong kho',
            self::AVAILABLE             => 'Sẵn sàng sử dụng',
            self::IN_USE                => 'Đang sử dụng',
            self::TEMPORARILY_SUSPENDED => 'Tạm ngừng sử dụng',
            self::UNDER_MAINTENANCE     => 'Đang bảo trì',
            self::UNDER_REPAIR          => 'Đang sửa chữa',
            self::WAITING_FOR_PARTS     => 'Chờ linh kiện',
            self::UNDER_INSPECTION      => 'Đang kiểm định',
            self::ON_LOAN               => 'Đang cho mượn',
            self::RECALLED              => 'Đã thu hồi',
            self::BROKEN_BEYOND_REPAIR  => 'Hỏng không thể sửa',
            self::LOST                  => 'Mất',
            self::PENDING_LIQUIDATION   => 'Chờ thanh lý',
            self::LIQUIDATED            => 'Đã thanh lý',
            self::DESTROYED             => 'Đã hủy',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING_RECEIPT       => 'gray',
            self::IN_STOCK              => 'blue',
            self::AVAILABLE             => 'green',
            self::IN_USE                => 'teal',
            self::TEMPORARILY_SUSPENDED => 'yellow',
            self::UNDER_MAINTENANCE     => 'orange',
            self::UNDER_REPAIR          => 'purple',
            self::WAITING_FOR_PARTS     => 'indigo',
            self::UNDER_INSPECTION      => 'cyan',
            self::ON_LOAN               => 'sky',
            self::RECALLED              => 'red',
            self::BROKEN_BEYOND_REPAIR  => 'rose',
            self::LOST                  => 'red',
            self::PENDING_LIQUIDATION   => 'amber',
            self::LIQUIDATED            => 'slate',
            self::DESTROYED             => 'gray',
        };
    }

    /**
     * Valid transitions: what statuses can this status transition to?
     */
    public function allowedTransitions(): array
    {
        return match($this) {
            self::PENDING_RECEIPT       => [self::IN_STOCK],
            self::IN_STOCK              => [self::AVAILABLE, self::RECALLED, self::PENDING_LIQUIDATION],
            self::AVAILABLE             => [self::IN_USE, self::UNDER_MAINTENANCE, self::UNDER_REPAIR, self::UNDER_INSPECTION, self::ON_LOAN, self::RECALLED, self::PENDING_LIQUIDATION],
            self::IN_USE                => [self::AVAILABLE, self::UNDER_MAINTENANCE, self::UNDER_REPAIR, self::TEMPORARILY_SUSPENDED, self::ON_LOAN, self::RECALLED, self::PENDING_LIQUIDATION],
            self::TEMPORARILY_SUSPENDED => [self::AVAILABLE, self::UNDER_REPAIR, self::RECALLED, self::PENDING_LIQUIDATION],
            self::UNDER_MAINTENANCE     => [self::AVAILABLE, self::IN_USE],
            self::UNDER_REPAIR          => [self::AVAILABLE, self::IN_USE, self::WAITING_FOR_PARTS, self::BROKEN_BEYOND_REPAIR],
            self::WAITING_FOR_PARTS     => [self::UNDER_REPAIR, self::BROKEN_BEYOND_REPAIR],
            self::UNDER_INSPECTION      => [self::AVAILABLE, self::IN_USE],
            self::ON_LOAN               => [self::AVAILABLE, self::IN_USE],
            self::RECALLED              => [self::PENDING_LIQUIDATION, self::AVAILABLE],
            self::BROKEN_BEYOND_REPAIR  => [self::PENDING_LIQUIDATION],
            self::LOST                  => [self::PENDING_LIQUIDATION],
            self::PENDING_LIQUIDATION   => [self::LIQUIDATED, self::AVAILABLE],
            self::LIQUIDATED            => [],
            self::DESTROYED             => [],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions());
    }

    public static function activeStatuses(): array
    {
        return [
            self::AVAILABLE,
            self::IN_USE,
            self::IN_STOCK,
            self::TEMPORARILY_SUSPENDED,
        ];
    }

    public static function inactiveStatuses(): array
    {
        return [
            self::UNDER_MAINTENANCE,
            self::UNDER_REPAIR,
            self::WAITING_FOR_PARTS,
            self::UNDER_INSPECTION,
            self::ON_LOAN,
        ];
    }
}
