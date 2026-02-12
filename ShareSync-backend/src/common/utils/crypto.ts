import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoUtil {
  /**
   * Create a base64url(HMAC_SHA256(secret, data)).
   */
  hmac(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('base64url');
  }

  /**
   * Timing-safe string compare.
   */
  safeEqual(a: string, b: string): boolean {
    const aa = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  }

  /**
   * SHA256 hash helper (hex).
   */
  sha256Hex(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Random 6-digit code.
   */
  code6(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Sign a stateless token:
   * token = base64url(JSON(payload)) + "." + base64url(HMAC(payloadB64))
   */
  signToken<T extends object>(payload: T, envSecretName: string): string {
    const secret = process.env[envSecretName];
    if (!secret) throw new BadRequestException(`${envSecretName} not configured`);

    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');
    const sigB64 = this.hmac(payloadB64, secret);

    return `${payloadB64}.${sigB64}`;
  }

  /**
   * Verify a stateless token and return payload.
   */
  verifyToken<T>(token: string, envSecretName: string): T {
    const secret = process.env[envSecretName];
    if (!secret) throw new BadRequestException(`${envSecretName} not configured`);

    const parts = String(token || '').split('.');
    if (parts.length !== 2) throw new BadRequestException('Invalid token format');

    const [payloadB64, sigB64] = parts;

    const expected = this.hmac(payloadB64, secret);
    if (!this.safeEqual(expected, sigB64)) throw new BadRequestException('Invalid token signature');

    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');

    try {
      return JSON.parse(json) as T;
    } catch {
      throw new BadRequestException('Invalid token payload');
    }
  }
}
