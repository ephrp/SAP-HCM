import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AuditAction =
  | 'EMPLOYEE_CREATED'
  | 'ACCOUNT_CREATED'
  | 'LEAVE_CREATED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'TRAINING_CREATED'
  | 'TRAINING_ASSIGNED';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  action!: AuditAction;

  @Column({ name: 'actor_user_id', type: 'int', nullable: true })
actorUserId!: number | null;

@Column({
  name: 'actor_email',
  type: 'varchar',
  length: 150,
  nullable: true,
})
actorEmail!: string | null;

  @Column({ name: 'target_type', length: 80 })
  targetType!: string;

  @Column({ name: 'target_id', type: 'int', nullable: true })
  targetId?: number | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}