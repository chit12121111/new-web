import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { subscription: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error: any) {
      // Re-throw UnauthorizedException as-is
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Log and re-throw other errors (database, etc.)
      console.error('❌ Validate user error:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Determine if this is a try-out registration
    const isTryout = registerDto.isTryout || false;
    let role: UserRole = UserRole.FREE;
    let seoCredits = 0;
    let reelCredits = 0;
    let tryoutStartDate: Date | null = null;
    let tryoutEndDate: Date | null = null;

    if (isTryout) {
      role = UserRole.TRYOUT;
      seoCredits = parseInt(this.configService.get('TRYOUT_SEO_CREDITS', '3'));
      reelCredits = parseInt(this.configService.get('TRYOUT_REEL_CREDITS', '5'));
      tryoutStartDate = new Date();
      const tryoutDays = parseInt(this.configService.get('TRYOUT_DURATION_DAYS', '7'));
      tryoutEndDate = new Date(Date.now() + tryoutDays * 24 * 60 * 60 * 1000);
    }

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role,
        seoCredits,
        reelCredits,
        tryoutStartDate,
        tryoutEndDate,
      },
    });

    // Create subscription for non-tryout users
    if (!isTryout) {
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          planType: UserRole.FREE,
          status: 'ACTIVE',
          monthlySeoCredits: 0,
          monthlyReelCredits: 0,
        },
      });
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    try {
      // Validate JWT_SECRET is set
      const jwtSecret = this.configService.get('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = await this.generateRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          seoCredits: user.seoCredits,
          reelCredits: user.reelCredits,
        },
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    try {
      // Validate JWT_REFRESH_SECRET is set
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
      if (!refreshSecret) {
        // Fallback to JWT_SECRET if JWT_REFRESH_SECRET is not set
        const jwtSecret = this.configService.get('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_REFRESH_SECRET or JWT_SECRET must be configured');
        }
      }

      const payload = { sub: userId, type: 'refresh' };
      const refreshToken = this.jwtService.sign(payload, {
        secret: refreshSecret || this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await this.prisma.refreshToken.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt,
        },
      });

      return refreshToken;
    } catch (error: any) {
      console.error('❌ Generate refresh token error:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = tokenRecord.user;
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          seoCredits: user.seoCredits,
          reelCredits: user.reelCredits,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }
}

