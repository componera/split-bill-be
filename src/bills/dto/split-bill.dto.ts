import { IsArray, IsUUID } from 'class-validator';

export class SplitItemsDto {
	@IsUUID()
	billId: string;

	@IsArray()
	itemIds: string[];
}
