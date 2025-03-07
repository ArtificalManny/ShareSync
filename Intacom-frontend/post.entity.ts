import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { Comment } from '../comments/comment.entity';
import { Like } from '../likes/like.entity';

@Entity()
export class Post {
  @Column({ primary: true, type: 'uuid' })
  id: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  media: string;

  @ManyToOne(() => Project, (project) => project.posts)
  project: Project;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Column()
  createdAt: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];
}