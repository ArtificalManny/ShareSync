import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Entity()
export class Like{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
    post: Post;

    @ManyToOne(() => User, (user) => user.likes, { eager: true })
    user: User;

    @PrimaryGeneratedColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}