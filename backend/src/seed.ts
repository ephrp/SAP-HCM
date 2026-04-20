import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './users/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const email = 'admin@test.com';

  // Vérifier si déjà existant
  const existing = await userRepo.findOne({ where: { email } });

  if (existing) {
    console.log('⚠️ Admin already exists:', email);
    await app.close();
    return;
  }

  // Hash du mot de passe
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = userRepo.create({
    email,
    passwordHash,
    role: 'HR_ADMIN',
    isActive: true,
  });

  await userRepo.save(admin);

  console.log('✅ Admin créé avec succès');
  console.log('📧 Email:', email);
  console.log('🔑 Password: 123456');

  await app.close();
}

bootstrap();