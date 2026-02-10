import { IsOptional, IsUUID } from 'class-validator';

export class PaymentQueryDto {
    @IsOptional()
    @IsUUID()
    restaurantId?: string;

    @IsOptional()
    @IsUUID()
    billId?: string;
}
