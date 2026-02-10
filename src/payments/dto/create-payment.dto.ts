/* eslint-disable prettier/prettier */
import { IsUUID, IsNumber } from 'class-validator';

export class CreatePaymentDto {

    @IsUUID()
    restaurantId: string;

    @IsUUID()
    billId: string;

    @IsNumber()
    amount: number;
}
