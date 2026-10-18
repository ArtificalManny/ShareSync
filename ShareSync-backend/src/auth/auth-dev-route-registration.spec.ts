import { MODULE_METADATA } from '@nestjs/common/constants';
import { readFileSync } from 'fs';
import { join } from 'path';

import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';

describe('V2G1-R0 development token route disabled', () => {
  const registeredControllers: unknown[] =
    Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      AuthModule,
    ) || [];

  it('preserves the normal authentication controller', () => {
    expect(registeredControllers).toContain(AuthController);
  });

  it('does not register any development-token controller', () => {
    const names = registeredControllers.map(
      (controller: any) => controller?.name,
    );

    expect(names).not.toContain('DevAuthController');
    expect(registeredControllers).toEqual([AuthController]);
  });

  it('removes development-token imports and registration from AuthModule', () => {
    const source = readFileSync(
      join(__dirname, 'auth.module.ts'),
      'utf8',
    );

    expect(source).not.toContain(
      "from './dev-auth.controller'",
    );

    expect(source).not.toContain('DevAuthController');

    expect(source).toContain(
      'controllers: [AuthController]',
    );
  });
});
