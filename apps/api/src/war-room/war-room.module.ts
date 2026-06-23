import { Module } from '@nestjs/common';
import { WarRoomController } from './war-room.controller';
import { WarRoomService } from './war-room.service';

@Module({ controllers: [WarRoomController], providers: [WarRoomService] })
export class WarRoomModule {}
