import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController, SetupController } from './admin.controller';

@Module({
  controllers: [AdminController, SetupController],
  providers: [AdminService],
})
export class AdminModule {}

