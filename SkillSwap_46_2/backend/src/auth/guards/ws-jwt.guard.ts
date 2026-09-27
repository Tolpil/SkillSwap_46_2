import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { jwtConfig } from '../../config/jwt.config';
import { JwtPayload, SocketWithUser } from '../auth.types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<SocketWithUser>();

    this.verify(client);

    return true;
  }

  verify(client: SocketWithUser): JwtPayload {
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Токен не предоставлен');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtConfiguration.accessSecret,
      });

      client.data.user = payload;

      return payload;
    } catch {
      throw new WsException('Невалидный или просроченный токен');
    }
  }

  private extractToken(client: SocketWithUser): string | undefined {
    const cookieHeader = client.handshake.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    const prefix = 'accessToken=';
    const accessTokenCookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    return accessTokenCookie
      ? decodeURIComponent(accessTokenCookie.slice(prefix.length))
      : undefined;
  }
}
