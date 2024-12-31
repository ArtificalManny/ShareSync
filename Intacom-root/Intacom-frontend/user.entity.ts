import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typerorm';
import { Post } from '.../posts/post.entity';
import { Comment } from '.../comments/comment.entity';
import { Like } from '../likes/like.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string; //Hashed password

    @Column()
    name: string;

    @Column({ nullable: true })
    profilePicture: string;

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

    @OneToMany(() => Like, (like) => like.user)
    likes: Like[];
}