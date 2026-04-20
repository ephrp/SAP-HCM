import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const JWT_SECRET = 'fallback_secret_change_me';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.log('JWT STRATEGY SECRET =', JWT_SECRET);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    role: string;
    employeeId: number | null;
  }) {
    console.log('JWT PAYLOAD VALIDATED =', payload);

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      employeeId: payload.employeeId,
    };
  }
}