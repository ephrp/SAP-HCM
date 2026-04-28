import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id ?? null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id ?? null,
        firstName: user.employee?.firstName ?? null,
        lastName: user.employee?.lastName ?? null,
        departmentName: user.employee?.department?.name ?? null,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async forgotPassword(email: string) {
  const user = await this.usersService.findByEmail(email);

  // Réponse volontairement neutre pour éviter d'indiquer si l'email existe
  if (!user || !user.isActive) {
    return {
      message: 'If this email exists, a reset link has been sent.',
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await this.usersService.savePasswordResetToken(
    user.id,
    tokenHash,
    expiresAt,
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

  await this.mailService.sendPasswordResetEmail({
    to: user.email,
    firstName: user.employee?.firstName ?? null,
    resetLink,
  });

  return {
    message: 'If this email exists, a reset link has been sent.',
  };
}

async resetPassword(token: string, newPassword: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await this.usersService.findByResetTokenHash(tokenHash);

  if (!user || !user.resetPasswordExpiresAt) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
    await this.usersService.clearPasswordResetToken(user.id);
    throw new BadRequestException('Invalid or expired reset token');
  }

  await this.usersService.updatePassword(user.id, newPassword);
  await this.usersService.clearPasswordResetToken(user.id);

  return {
    message: 'Password reset successfully',
  };
}

  async changePassword(
    currentUser: {
      userId: number;
      email: string;
      role: string;
      employeeId: number | null;
    },
    currentPassword: string,
    newPassword: string,
  ) {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const user = await this.usersService.findOne(currentUser.userId);

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.updatePassword(user.id, newPassword);

    return {
      message: 'Password changed successfully',
    };
  }
}