import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import {
  ResumeRecord,
  ResumeRecordSchema,
} from './schemas/resume-record.schema';
import { InterviewModule } from '../interview/interview.module';

@Module({
  imports: [
    InterviewModule,
    MongooseModule.forFeature([
      { name: ResumeRecord.name, schema: ResumeRecordSchema },
    ]),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService, MongooseModule],
})
export class ResumeModule {}
