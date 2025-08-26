import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotifyService } from './notify.service';

@Injectable()
export class NotifyCron {
  constructor(private readonly notify: NotifyService) {}

  // Every day at 5pm server time
  @Cron('0 17 * * *')
  handleDaily() {
    this.notify.flushEmailBatches();
  }
}
