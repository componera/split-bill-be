import { IsString, IsOptional } from 'class-validator';

export class CreateBillDto {
	@IsString()
	restaurantId: string;

	@IsOptional()
	@IsString()
	lightspeedSaleId?: string;

	@IsOptional()
	@IsString()
	tableName?: string;
}
