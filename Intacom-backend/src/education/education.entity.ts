// src/education/education.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user.entity';

@Entity()
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  degree!: string;

  @Column()
  school!: string;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ManyToOne(() => User, (user: User) => user.education, { onDelete: 'CASCADE' })
  user!: User;
}
