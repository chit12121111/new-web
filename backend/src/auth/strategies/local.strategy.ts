import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      if (!email || !password) {
        console.log('❌ LocalStrategy: Missing email or password');
        throw new UnauthorizedException('Email and password are required');
      }

      console.log(`🔍 LocalStrategy: Validating email: ${email}`);
      const user = await this.authService.validateUser(email, password);
      
      if (!user) {
        console.log('❌ LocalStrategy: User validation returned null');
        throw new UnauthorizedException('Invalid credentials');
      }
      
      console.log(`✅ LocalStrategy: User validated successfully: ${user.email}`);
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ LocalStrategy validation error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}

