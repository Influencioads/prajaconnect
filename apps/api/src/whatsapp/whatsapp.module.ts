import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TempGrievancesModule } from '../temp-grievances/temp-grievances.module';

@Module({
  imports: [TempGrievancesModule],
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
