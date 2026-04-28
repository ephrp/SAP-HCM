 import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('forgot-password')
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto.email);
}

@Post('reset-password')
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}
}