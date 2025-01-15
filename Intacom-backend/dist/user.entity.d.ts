import { Experience } from '../experiences/experience.entity';
import { Education } from '../education/education.entity';
import { Project } from '../projects/project.entity';
export declare class User {
    id: string;
    name: string;
    headline: string;
    bio?: string;
    contact?: string;
    profilePicture?: string;
    coverImage?: string;
    experiences: Experience[];
    education: Education[];
    projects: Project[];
}
