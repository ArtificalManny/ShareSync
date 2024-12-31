import { Module } from '@nestjs/commmon';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from '/auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';

@Module({
    import: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost', //Update as needed
            port: 5432,
            username: 'your-username',
            password: 'your-password',
            database: 'IntelliSpace',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true, //Disable in production
        }),
        UsersModule
        ProjectsModule,
        PostsModule,
        AuthModule,
        CommentsModule,
        LikesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}