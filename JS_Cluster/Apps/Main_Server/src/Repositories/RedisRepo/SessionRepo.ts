import { redisClient } from "../../RedisConfig.js";


export enum LogInType {
    CUSTOMER = "customer",
    ADMIN = "admin"
}
export type SessionObject = {
    _id: string;            // unique session ID
    userId: string;
    validPeriod: number;    // in ms
    createdAt: Date;
    logInType: LogInType
}

/**
 * Lưu session theo chính sách 1-user-1-session.
 * Nếu user đã có session khác: xóa session cũ, ghi session mới (atomic bằng Lua).
 */
const LUA_SAVE_SINGLE_SESSION = `
local userKey = KEYS[1]          -- user_session:<userId>
local newSessionKey = KEYS[2]    -- session:<newSessionId>

local userId        = ARGV[1]
local newSessionId  = ARGV[2]
local value         = ARGV[3]
local ttl           = tonumber(ARGV[4])

-- tìm session cũ của user (nếu có)
local oldSessionId = redis.call('GET', userKey)
if oldSessionId and oldSessionId ~= newSessionId then
  local oldSessionKey = 'session:' .. oldSessionId
  redis.call('DEL', oldSessionKey)       -- xóa session cũ
end

-- cập nhật mapping user -> sessionId (TTL giống phiên mới)
redis.call('SET', userKey, newSessionId, 'EX', ttl)

-- ghi session mới với TTL
redis.call('SET', newSessionKey, value, 'EX', ttl)

-- trả về oldSessionId (hoặc chuỗi rỗng)
return oldSessionId or ''
`;

export async function saveSession(session: SessionObject): Promise<void> {
  const sessionKey = `session:${session._id}`;
  const userKey = `user_session:${session.userId}`;
  const ttlSeconds = Math.floor(session.validPeriod / 1000);

  const value = JSON.stringify({
    ...session,
    createdAt: session.createdAt.toISOString(),
  });

  const res = await redisClient.eval(LUA_SAVE_SINGLE_SESSION, {
    keys: [userKey, sessionKey],
    arguments: [session.userId, session._id, value, String(ttlSeconds)],
  });

  const oldId = String(res || "");
  if (oldId && oldId.length > 0 && oldId !== session._id) {
    console.log(`♻️  Replaced old session for user=${session.userId}: ${oldId} -> ${session._id}`);
  } else {
    console.log(`✅ Session stored (user=${session.userId}, session=${session._id}, ttl=${ttlSeconds}s)`);
  }
}


/** Retrieve session by ID */
export async function getSession(sessionId: string): Promise<SessionObject | null> {
  const key = `session:${sessionId}`;
  const data = await redisClient.get(key);
  if (!data) return null;

  const parsed = JSON.parse(data);
  parsed.createdAt = new Date(parsed.createdAt);
  return parsed as SessionObject;
}

/** Delete a session (logout) — removes both the session and its user mapping */
export async function deleteSession(sessionId: string, userId?: string): Promise<void> {
  const sessionKey = `session:${sessionId}`;

  // 1️⃣ Delete the actual session data
  await redisClient.del(sessionKey);

  // 2️⃣ Delete the user→session mapping if provided
  if (userId) {
    const userKey = `user_session:${userId}`;
    const current = await redisClient.get(userKey);

    // only delete if this mapping still points to the same session
    if (current === sessionId) {
      await redisClient.del(userKey);
      console.log(`🧹 Mapping cleared for user=${userId}`);
    }
  }

  console.log(`🗑️ Session deleted (sessionId=${sessionId})`);
}