// src/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Import Post entity and DTOs
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { Project } from '../projects/project.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createPostDto: CreatePostDto, projectId: string, userId: string): Promise<Post> {
    const project = await this.projectsRepository.findOne(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    const post = this.postsRepository.create({
      ...createPostDto,
      project,
    });
    return this.postsRepository.save(post);
  }

  async findAllByProject(projectId: string): Promise<Post[]> {
    return this.postsRepository.find({
      where: { project: { id: projectId } },
      relations: ['comments', 'likes', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Post> {
    return this.postsRepository.findOne(id, { relations: ['comments', 'likes', 'user'] });
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const post = await this.findById(postId);
    if (!post) throw new Error('Post not found');
    // Prevent duplicate likes
    if (post.likes.some(like => like.user.id === userId)) {
      throw new Error('User already liked this post');
    }
    post.likes.push({ user: { id: userId } as any });
    await this.postsRepository.save(post);
  }

  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    const post = await this.findById(postId);
    if (!post) throw new Error('Post not found');
    const comment = new Comment();
    comment.content = content;
    comment.user = { id: userId } as any;
    comment.post = post;
    post.comments.push(comment);
    await this.postsRepository.save(post);
    return comment;
  }
}
