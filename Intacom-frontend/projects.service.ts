import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/common';
import { Repository } from 'typeorm';
//Import Project enitity and DTOs
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
    ) {}

    async create(createProjectDto: CreateProjectDto, ownerId: string): Promise<Project> {
        const project = this.projectsRepository.create({
            ...createProjectDto,
            ownerId,
        });
        return this.projectsRepository.save(project);
    }

    async findAll(): Promise<Project[]> {
        return this.projectsRepository.find();
    }

    async findbyId(id: string): Promise<Project> {
        return this.projectsRepository.findOne(id);
    }
}