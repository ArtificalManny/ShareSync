import { Controller, Post as HttpPost, Body, UseGuards, Request, Get, Param, UploadedFiles, UseInterceptors, HttpException, HttpStatus } from '@nestjs/commons';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto.create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Controller('projects/:projectId/posts')
export class PostsController {
    constructor(private postsService: PostsService) {}

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FilesInterceptor('files', 3, {
        storage: diskStorage({
            destination:'./uploads/projects',
            filename: (req, file, cb) => {
                const uniqueSuffix = uuidv4() + path.extreme(file.originalname);
                cb(null, uniqueSuffix);
            },
        }),
    }))
    @HttpPost()
    async createPost(
        @Param('projectId') projectId: string,
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() CreatePostDto: CreatePostDto,
        @Request() req
    ) {
        //Handle file uploads
        files.forEach(file => {
            if (file.mimetype.startsWith('image/')) {
                CreatePostDto.mediaImage = `/uploads/projects/${projectId}/${file.filename}`;
            } else if (file.mimetype.startsWith('video/')) {
                CreatePostDto.mediaVideo = `/uploads/projects/${projectId}/${file.filename}`;
            } else if (file.mimetype.startsWith('audio/')) {
                CreatePostDto.mediaAudio = `/uploads/projects/${projectId}/${file.filename}`;
            }
        });

        try {
            const post = await this.postsService.create(createPostDto, projectId, req.user.userId);
            //Emit event via Socket.io (implementation depends on integration)
            //Example: this.socket.emit('newPost', post);
            return post;
        } catch(error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getPosts(@Param('projectId') projectId: string) {
        return this.postsService.findAllByProject(projectId);
    }

    @UseGuards(JwtAuthGuard)
    @HttpPost(':postId/like')
    async likePost(
        @Param('projectId') projectId: string, 
        @Param('postId') postId: string,
        @Request() req
    ) {
        try {
            await this.postsService.likePost(postId, req.user.userId);
            return { message: 'Post liked successfully' };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @UseGuards(JwtAuthGuard)
    @HttpPost('/postId/comment')
    async commentPost(
        @Param('projectId') projectId: string,
        @Param('postId') postId: string,
        @Body('content') content: string,
        @Request() req
    ) {
        try {
            const comment = await this.postsService.addComment(postId, req.user.userId, content);
            //Emit event via Socket.io (implementation depends on integration)
            //Example: this.socket.emit('newComment', comment);
            return comment;
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}