import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from '../posts/post.entity';

@Entity()
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    status: string;
    
    @Column()
    ownerId: string; // Reference to User

    @OneToMany(() => Post, (post) => post.project)
    posts: Post[];
}