import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';
import { ResumeService } from './resume.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('getInterviewResumeList')
  async getInterviewResumeList(@Request() req: any) {
    const result = await this.resumeService.getResumeList(req.user.userId);
    return ResponseUtil.success(result, '获取成功');
  }

  @Post('uploadResume')
  async uploadResume(
    @Request() req: any,
    @Body() body: { url?: string; resumeName?: string; uploadTime?: string },
  ) {
    const result = await this.resumeService.uploadResume(req.user.userId, body);
    return ResponseUtil.success(result, '上传成功');
  }

  @Post('uploadResumeFile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResumeFile(
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() body: { resumeName?: string },
  ) {
    const result = await this.resumeService.uploadResumeFile(
      req.user.userId,
      file,
      body,
    );
    return ResponseUtil.success(result, '上传成功');
  }

  @Post('deleteResume')
  async deleteResume(@Request() req: any, @Body() body: { resumeId?: string }) {
    const result = await this.resumeService.deleteResume(
      req.user.userId,
      body.resumeId,
    );
    return ResponseUtil.success(result, '删除成功');
  }

  @Post('updateResumeName')
  async updateResumeName(
    @Request() req: any,
    @Body() body: { resumeId?: string; resumeName?: string },
  ) {
    const result = await this.resumeService.updateResumeName(
      req.user.userId,
      body,
    );
    return ResponseUtil.success(result, '更新成功');
  }
}
