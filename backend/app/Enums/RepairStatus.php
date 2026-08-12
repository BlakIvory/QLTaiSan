<?php

namespace App\Enums;

enum RepairStatus: string
{
    case NEW            = 'NEW';
    case RECEIVED       = 'RECEIVED';
    case INSPECTING     = 'INSPECTING';
    case WAITING_QUOTE  = 'WAITING_QUOTE';
    case WAITING_APPROVAL = 'WAITING_APPROVAL';
    case REPAIRING      = 'REPAIRING';
    case WAITING_PARTS  = 'WAITING_PARTS';
    case COMPLETED      = 'COMPLETED';
    case HANDED_OVER    = 'HANDED_OVER';
    case UNREPAIRABLE   = 'UNREPAIRABLE';
    case CANCELLED      = 'CANCELLED';

    public function label(): string
    {
        return match($this) {
            self::NEW             => 'Mới tạo',
            self::RECEIVED        => 'Đã tiếp nhận',
            self::INSPECTING      => 'Đang kiểm tra',
            self::WAITING_QUOTE   => 'Chờ báo giá',
            self::WAITING_APPROVAL => 'Chờ phê duyệt',
            self::REPAIRING       => 'Đang sửa chữa',
            self::WAITING_PARTS   => 'Chờ linh kiện',
            self::COMPLETED       => 'Đã hoàn thành',
            self::HANDED_OVER     => 'Đã bàn giao',
            self::UNREPAIRABLE    => 'Không thể sửa chữa',
            self::CANCELLED       => 'Đã hủy',
        };
    }

    public function allowedTransitions(): array
    {
        return match($this) {
            self::NEW             => [self::RECEIVED, self::CANCELLED],
            self::RECEIVED        => [self::INSPECTING, self::CANCELLED],
            self::INSPECTING      => [self::WAITING_QUOTE, self::REPAIRING, self::UNREPAIRABLE, self::CANCELLED],
            self::WAITING_QUOTE   => [self::WAITING_APPROVAL, self::CANCELLED],
            self::WAITING_APPROVAL => [self::REPAIRING, self::CANCELLED],
            self::REPAIRING       => [self::WAITING_PARTS, self::COMPLETED, self::UNREPAIRABLE],
            self::WAITING_PARTS   => [self::REPAIRING, self::UNREPAIRABLE],
            self::COMPLETED       => [self::HANDED_OVER],
            self::HANDED_OVER     => [],
            self::UNREPAIRABLE    => [],
            self::CANCELLED       => [],
        };
    }
}

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

enum DamagePriority: string
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
            self::CRITICAL => 'Khẩn cấp',
        };
    }
}
