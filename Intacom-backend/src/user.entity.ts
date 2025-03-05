import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Experience } from './experiences/experience.entity';
import { Education } from './education/education.entity';
import { Project } from './projects/project.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;
    
    @Column()
    headline!: string;

    @Column({ nullable: true })
    bio?: string;

    @Column({ nullable: true })
    contact?: string;

    @Column({ nullable: true })
    profilePicture?: string;

    @Column({ nullable: true })
    coverImage?: string;

    @OneToMany(() => Experience, (experience) => experience.user, { cascade: true })
    experiences!: Experience[];
  
    @OneToMany(() => Education, (education) => education.user, { cascade: true })
    education!: Education[];
  
    @OneToMany(() => Project, (project) => project.user, { cascade: true })
    projects!: Project[];
}