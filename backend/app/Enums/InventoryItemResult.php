<?php

namespace App\Enums;

enum InventoryItemResult: string
{
    case MATCH          = 'MATCH';
    case WRONG_LOCATION = 'WRONG_LOCATION';
    case WRONG_UNIT     = 'WRONG_UNIT';
    case DAMAGED        = 'DAMAGED';
    case NOT_FOUND      = 'NOT_FOUND';
    case NOT_IN_SYSTEM  = 'NOT_IN_SYSTEM';
    case REQUEST_REPAIR = 'REQUEST_REPAIR';
    case REQUEST_LIQUIDATION = 'REQUEST_LIQUIDATION';

    public function label(): string
    {
        return match($this) {
            self::MATCH              => 'Đúng thông tin',
            self::WRONG_LOCATION     => 'Sai vị trí',
            self::WRONG_UNIT         => 'Sai đơn vị',
            self::DAMAGED            => 'Hư hỏng',
            self::NOT_FOUND          => 'Không tìm thấy',
            self::NOT_IN_SYSTEM      => 'Thiết bị chưa có trong hệ thống',
            self::REQUEST_REPAIR     => 'Đề nghị sửa chữa',
            self::REQUEST_LIQUIDATION => 'Đề nghị thanh lý',
        };
    }
}
