import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Post } from '../post.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column()
  user: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;
}