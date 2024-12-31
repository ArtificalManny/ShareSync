import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Like])],
    exports: [TypeOrmModule],
})
export class LikesModule {}