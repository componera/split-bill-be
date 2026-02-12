// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
	imports: [TypeOrmModule.forFeature([User])],
	providers: [UsersService],
	exports: [UsersService], // ✅ make it available to other modules
})
export class UsersModule { }
