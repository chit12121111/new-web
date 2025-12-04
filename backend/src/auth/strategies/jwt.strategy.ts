import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      const error = 'JWT_SECRET is not configured. Please set JWT_SECRET environment variable.';
      Logger.error(error, 'JwtStrategy');
      throw new Error(error);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      this.logger.warn('Invalid JWT payload: missing sub field');
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn(`User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}

