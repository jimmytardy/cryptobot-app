import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from 'src/model/User';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    } else if (!user.active) {
      throw new UnauthorizedException('Ce compte est désactivé');
    }
    return user;
  }
}