import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ResumeRecordDocument = ResumeRecord & Document;

@Schema({ timestamps: true })
export class ResumeRecord {
  @Prop({ required: true, unique: true, index: true })
  resumeId: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ default: '' })
  url?: string;

  @Prop({ required: true })
  resumeName: string;

  @Prop()
  uploadTime?: Date;

  @Prop({ default: false })
  isJianLiWang?: boolean;

  @Prop()
  templateName?: string;

  @Prop()
  fileType?: string;

  @Prop({
    enum: ['url_upload', 'direct_upload', 'manual'],
    default: 'url_upload',
  })
  sourceType?: string;

  @Prop({ type: String })
  contentSnapshot?: string;
}

export const ResumeRecordSchema = SchemaFactory.createForClass(ResumeRecord);

ResumeRecordSchema.index({ userId: 1, createdAt: -1 });
