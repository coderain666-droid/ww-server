import { Logger } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';

const logger = new Logger('EmbeddedMongo');
let mongoServer: MongoMemoryServer | null = null;

function isLocalMongoUri(uri: string): boolean {
  return /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/|$)/i.test(
    uri,
  );
}

function shouldUseEmbeddedMongo(configuredUri: string): boolean {
  const explicit = process.env.USE_EMBEDDED_MONGO?.toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;

  if (process.env.LOCAL_DEV_MODE?.toLowerCase() === 'true') {
    return true;
  }

  return isLocalMongoUri(configuredUri);
}

export async function resolveMongoUri(): Promise<string> {
  const configuredUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/wwzhidao';

  if (!shouldUseEmbeddedMongo(configuredUri)) {
    logger.log(`使用外部 MongoDB: ${configuredUri}`);
    return configuredUri;
  }

  if (!mongoServer) {
    logger.warn('检测到本地开发配置，自动启用内嵌 MongoDB');
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'wwzhidao',
      },
    });
    logger.log(`内嵌 MongoDB 已启动: ${mongoServer.getUri()}`);
  }

  return mongoServer.getUri();
}

export async function stopEmbeddedMongo(): Promise<void> {
  if (!mongoServer) return;

  await mongoServer.stop();
  mongoServer = null;
  logger.log('内嵌 MongoDB 已停止');
}
