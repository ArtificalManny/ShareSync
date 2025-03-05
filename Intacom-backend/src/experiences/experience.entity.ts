// src/experiences/experience.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user.entity';

@Entity()
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  company!: string;

  @Column()
  years!: string;

  @ManyToOne(() => User, user => user.experiences)
  user!: User;
}
