// src/posts/post.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { Comment } from '../comments/comment.entity';
import { Like } from '../likes/like.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.posts, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  user: User;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  mediaImage: string;

  @Column({ nullable: true })
  mediaVideo: string;

  @Column({ nullable: true })
  mediaAudio: string;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
