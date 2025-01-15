import { Inject } from '@nestjs/common';
import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './create-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppGateway } from './Src/app.gateway';

@Controller('projects/:projectId/posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private readonly appGateway: AppGateway,
  ) {}

  // ... existing methods

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  async createPost(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createPostDto: CreatePostDto,
    @Request() req
  ) {
    // Handle file uploads
    files.forEach(file => {
      if (file.mimetype.startsWith('image/')) {
        createPostDto.mediaImage = `/uploads/projects/${projectId}/${file.filename}`;
      } else if (file.mimetype.startsWith('video/')) {
        createPostDto.mediaVideo = `/uploads/projects/${projectId}/${file.filename}`;
      } else if (file.mimetype.startsWith('audio/')) {
        createPostDto.mediaAudio = `/uploads/projects/${projectId}/${file.filename}`;
      }
    });

    try {
      const post = await this.postsService.create(createPostDto, projectId, req.user.userId);
      // Emit event via Socket.io
      this.appGateway.server.to(`project_${projectId}`).emit('newProjectPost', post);
      return post;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Similarly, emit events for comments and likes if needed
}