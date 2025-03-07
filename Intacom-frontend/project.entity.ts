import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Post } from '../post.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  admin: string;

  @Column('simple-array')
  sharedWith: string[];

  @OneToMany(() => Post, (post) => post.project)
  posts: Post[];

  @Column('simple-json', { nullable: true })
  announcements: {
    id: string;
    content: string;
    media?: string;
    user: string;
    likes: number;
    comments: { user: string; text: string; id?: string }[];
  }[];

  @Column('simple-json', { nullable: true })
  tasks: {
    id: string;
    title: string;
    assignee: string;
    dueDate: Date;
    status: string;
    user: string;
    comments: { user: string; text: string; id?: string }[];
  }[];
}