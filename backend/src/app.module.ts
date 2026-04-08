import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeesModule } from './employees/employees.module';
import { UsersModule } from './users/users.module';
import { LeavesModule } from './leaves/leaves.module';
import { TrainingsModule } from './trainings/trainings.module';
import { DepartmentsModule } from './departments/departments.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Mbelou1234',
      database: process.env.DB_NAME || 'sap_hcm',
      autoLoadEntities: true,
      synchronize: true,
    }),
    EmployeesModule,
    UsersModule,
    LeavesModule,
    TrainingsModule,
    DepartmentsModule,
    AuthModule,
  ],
})
export class AppModule {}
