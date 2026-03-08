import { Types } from 'mongoose';

/**
 * 本地开发 Mock 用户配置
 * 仅用于本地/开发环境，前端带固定 Token 时后端直接视为该用户已登录
 */

const MOCK_USER_ID = process.env.MOCK_USER_ID || 'mock_local_user_001';

/** Mock 用户写入 DB 时使用的占位 ObjectId（避免 mock 字符串无法转 ObjectId） */
export const MOCK_OBJECT_ID = new Types.ObjectId(
  '000000000000000000000001',
);
export function getMockObjectId(): Types.ObjectId {
  return MOCK_OBJECT_ID;
}
const MOCK_USERNAME = process.env.MOCK_USERNAME || '本地Mock用户';
const MOCK_EMAIL = process.env.MOCK_EMAIL || 'mock@local.dev';

export const MOCK_USER = {
  userId: MOCK_USER_ID,
  username: MOCK_USERNAME,
  email: MOCK_EMAIL,
};

/** 与前端写死的 mock 账户保持一致，用于 getUserInfo 等接口直接返回（不查库） */
export function getMockUserSnapshot(): Record<string, any> {
  return {
    _id: MOCK_USER_ID,
    username: MOCK_USERNAME,
    email: MOCK_EMAIL,
    phone: '',
    avatar: '',
    roles: ['user'],
    isActive: true,
    gender: 'other',
    isVerified: false,
    isVip: true,
    aiInterviewRemainingCount: 99,
    aiInterviewRemainingMinutes: 120,
    wwCoinBalance: 999,
    resumeRemainingCount: 99,
    specialRemainingCount: 99,
    behaviorRemainingCount: 99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function isMockUserId(userId: string): boolean {
  return userId === MOCK_USER_ID;
}

/** 请求头里带此 Token 时视为 Mock 已登录（可与 userId 组合：mock 或 mock:userId） */
export const MOCK_AUTH_TOKEN_PREFIX = 'mock';

export function isMockToken(authHeader?: string): boolean {
  if (!authHeader || typeof authHeader !== 'string') return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token === MOCK_AUTH_TOKEN_PREFIX || token.startsWith(`${MOCK_AUTH_TOKEN_PREFIX}:`);
}

export function getMockUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader || !isMockToken(authHeader)) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token === MOCK_AUTH_TOKEN_PREFIX) return MOCK_USER.userId;
  const prefix = `${MOCK_AUTH_TOKEN_PREFIX}:`;
  return token.startsWith(prefix) ? token.slice(prefix.length) : null;
}
