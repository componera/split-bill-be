import { TypeOrmModule } from '@nestjs/typeorm';
import Module from 'module';
import { BillSplit } from './bill-split.entity';
import { BillSplitsService } from './bill-splits.service';

@Module({
	imports: [TypeOrmModule.forFeature([BillSplit]), PaymentsModule],
	providers: [BillSplitsService],
	controllers: [BillSplitsController],
})
export class BillSplitsModule {}
