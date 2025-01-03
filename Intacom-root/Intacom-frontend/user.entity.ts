import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typerorm';
import { Post } from '.../posts/post.entity';
import { Comment } from '.../comments/comment.entity';
import { Like } from '../likes/like.entity';
import { Experience } from '../experiences/experience.entity';
import { Education } from '../education/education.entity';
import { Project } from '../projects/project.entity';

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

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;
    
    @Column()
    headline: string;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    contact: string;

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    coverImage: string;

    @OneToMany(() => Experience, experience => experience.user, { cascade: true })
    experiences: Experience[];

    @OneToMany(() => Education, education => education.user, { cascade: true })
    education: Eduaction[];

    @OneToMany(() => Project, project => project.user, { cascade: true })
    projects: Project[];
}