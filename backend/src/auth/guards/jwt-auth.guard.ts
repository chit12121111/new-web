import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err) {
      this.logger.error(`JWT authentication error: ${err.message}`, err.stack);
      throw err;
    }

    if (info) {
      // Log the specific JWT error
      this.logger.warn(`JWT authentication failed: ${info.message || JSON.stringify(info)}`);
      
      // Provide more specific error messages based on the error type
      if (info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      } else if (info.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      } else if (info.message === 'No auth token') {
        throw new UnauthorizedException('No authentication token provided');
      }
      
      throw new UnauthorizedException('Authentication failed');
    }

    if (!user) {
      this.logger.warn(`JWT authentication failed: No user found for request ${request.method} ${request.url}`);
      throw new UnauthorizedException('User not authenticated');
    }

    return user;
  }
}

