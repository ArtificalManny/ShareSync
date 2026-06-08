// src/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const host = cfg.get<string>('SMTP_HOST');
        const port = Number(cfg.get<string>('SMTP_PORT') ?? 587);
        const secure = String(cfg.get<string>('SMTP_SECURE') ?? 'false') === 'true';
        const user = cfg.get<string>('SMTP_USER');
        const pass = cfg.get<string>('SMTP_PASS');

        return {
          transport: {
            host,
            port,
            secure,
            family: 4,
            requireTLS: true,
            auth: user && pass ? { user, pass } : undefined,
          },
          defaults: {
            from: cfg.get<string>('MAIL_FROM') || 'ShareSync <no-reply@sharesync.app>',
          },
        };
      },
    }),
  ],
  exports: [MailerModule],
})
export class MailerConfigModule {}
