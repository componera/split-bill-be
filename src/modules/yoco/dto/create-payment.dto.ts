import { IsArray, IsUUID } from 'class-validator';

export class CreatePaymentDto {
	@IsUUID()
	restaurantId: string;

	@IsUUID()
	billId: string;

	@IsArray()
	itemIds: string[];
}
