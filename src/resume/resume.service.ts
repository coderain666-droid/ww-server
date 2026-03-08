import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  ResumeRecord,
  ResumeRecordDocument,
} from './schemas/resume-record.schema';
import { getMockObjectId, isMockUserId } from '../auth/mock-user.config';
import { DocumentParserService } from '../interview/services/document-parser.service';

@Injectable()
export class ResumeService {
  private readonly resumeFileFields = ['buffer', 'originalname', 'mimetype'];

  constructor(
    @InjectModel(ResumeRecord.name)
    private resumeRecordModel: Model<ResumeRecordDocument>,
    private readonly documentParserService: DocumentParserService,
  ) {}

  private getOwnerObjectId(userId: string): Types.ObjectId {
    return isMockUserId(userId) ? getMockObjectId() : new Types.ObjectId(userId);
  }

  async getResumeList(userId: string) {
    const records = await this.resumeRecordModel
      .find({ userId })
      .sort({ uploadTime: -1, createdAt: -1 })
      .lean();

    return records.map((record: any) => ({
      ...record,
      resumeId: record.resumeId,
      uploadTime: record.uploadTime || record.createdAt,
      isJianLiWang: Boolean(record.isJianLiWang),
      content: record.contentSnapshot || '',
    }));
  }

  async uploadResume(
    userId: string,
    body: { url?: string; resumeName?: string; uploadTime?: string },
  ) {
    if (!body.url) {
      throw new BadRequestException('缺少简历 URL');
    }

    if (!body.resumeName?.trim()) {
      throw new BadRequestException('缺少简历名称');
    }

    const record = await this.resumeRecordModel.create({
      resumeId: uuidv4(),
      user: this.getOwnerObjectId(userId),
      userId,
      url: body.url.trim(),
      resumeName: body.resumeName.trim(),
      uploadTime: body.uploadTime ? new Date(body.uploadTime) : new Date(),
      isJianLiWang: false,
      sourceType: 'url_upload',
    });

    return {
      resumeId: record.resumeId,
      url: record.url,
      resumeName: record.resumeName,
      uploadTime: record.uploadTime,
      isJianLiWang: false,
    };
  }

  async uploadResumeFile(
    userId: string,
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype?: string;
        }
      | undefined,
    body: { resumeName?: string },
  ) {
    if (!file) {
      throw new BadRequestException('请上传简历文件');
    }

    for (const field of this.resumeFileFields) {
      if (!(field in file)) {
        throw new BadRequestException('上传文件缺少必要字段');
      }
    }

    const rawText = await this.documentParserService.parseDocumentFromBuffer(
      file.buffer,
      file.originalname,
    );
    const cleanedText = this.documentParserService.cleanText(rawText);
    const validation =
      this.documentParserService.validateResumeContent(cleanedText);

    if (!validation.isValid) {
      throw new BadRequestException(validation.reason);
    }

    const resumeName =
      body.resumeName?.trim() ||
      file.originalname?.trim() ||
      `resume-${Date.now()}`;

    const record = await this.resumeRecordModel.create({
      resumeId: uuidv4(),
      user: this.getOwnerObjectId(userId),
      userId,
      url: '',
      resumeName,
      uploadTime: new Date(),
      isJianLiWang: false,
      sourceType: 'direct_upload',
      fileType: file.mimetype || file.originalname?.split('.').pop() || '',
      contentSnapshot: cleanedText,
    });

    return {
      resumeId: record.resumeId,
      url: '',
      resumeName: record.resumeName,
      uploadTime: record.uploadTime,
      isJianLiWang: false,
      sourceType: 'direct_upload',
    };
  }

  async deleteResume(userId: string, resumeId?: string) {
    if (!resumeId) {
      throw new BadRequestException('缺少 resumeId');
    }

    const record = await this.resumeRecordModel.findOneAndDelete({
      userId,
      resumeId,
    });
    if (!record) {
      throw new NotFoundException('简历不存在');
    }
    return { success: true };
  }

  async updateResumeName(
    userId: string,
    body: { resumeId?: string; resumeName?: string },
  ) {
    if (!body.resumeId) {
      throw new BadRequestException('缺少 resumeId');
    }

    if (!body.resumeName?.trim()) {
      throw new BadRequestException('缺少简历名称');
    }

    const record = await this.resumeRecordModel.findOneAndUpdate(
      {
        userId,
        resumeId: body.resumeId,
      },
      {
        $set: { resumeName: body.resumeName.trim() },
      },
      { new: true },
    );

    if (!record) {
      throw new NotFoundException('简历不存在');
    }

    return {
      resumeId: record.resumeId,
      resumeName: record.resumeName,
    };
  }

  async getResumeById(userId: string, resumeId: string) {
    return this.resumeRecordModel.findOne({ userId, resumeId }).lean();
  }
}
