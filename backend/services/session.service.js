import { randomUUID } from 'crypto';
import { log, DEBUG, WARN } from '../utils/logger.utils.js';
import { dbGet, dbRun, dbAll } from '../config/database.js';

// SQLite-backed single-session manager (Option A)
// user_sessions table defined in database initialization
class SessionService {
  // Cache detection of legacy tokenHash column
  static _checkedSchema = false;
  static _hasTokenHash = false;

  static async ensureSchema() {
    if (this._checkedSchema) return;
    try {
  const pragma = await dbAll('PRAGMA table_info(user_sessions);');
  this._hasTokenHash = Array.isArray(pragma) && pragma.some(r => r.name === 'tokenHash');
    } catch (e) {
      console.error('[SessionService.ensureSchema] failed to inspect schema', e);
    } finally {
      this._checkedSchema = true;
    }
  }

  static async startSession(userId) {
    const sessionId = randomUUID();
    try {
      await this.ensureSchema();
      if (this._hasTokenHash) {
        // Legacy wide schema columns: tokenHash (NOT NULL), expiresAt (NOT NULL), lastAccessedAt (NOT NULL default CURRENT_TIMESTAMP)
        // Build dynamic insert covering required NOT NULL columns present.
        await dbRun(`INSERT OR REPLACE INTO user_sessions 
          (userId, sessionId, tokenHash, expiresAt, createdAt, lastAccessedAt, lastSeenAt, revoked)
          VALUES (?, ?, ?, datetime('now', '+7 days'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
        `, [userId, sessionId, sessionId]);
      } else {
        await dbRun('INSERT OR REPLACE INTO user_sessions (userId, sessionId, createdAt, lastSeenAt, revoked) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)', [userId, sessionId]);
      }
      log(`[SessionService] startSession user=${userId} sessionId=${sessionId}`, DEBUG);
    } catch (e) {
      console.error('[SessionService.startSession] DB error', e);
      throw e;
    }
    return { sessionId };
  }

  static async getActiveSession(userId) {
    return await dbGet('SELECT userId, sessionId, createdAt, lastSeenAt, revoked FROM user_sessions WHERE userId = ? AND revoked = 0', [userId]);
  }

  static async validateSession(userId, sessionId) {
    const row = await dbGet('SELECT sessionId, revoked FROM user_sessions WHERE userId = ?', [userId]);
    const ok = !!(row && row.sessionId === sessionId && row.revoked === 0);
    if (!ok) {
      log(`[SessionService] validateSession failed user=${userId} provided=${sessionId} stored=${row?.sessionId}`, WARN);
    }
    return ok;
  }

  static async endSession(userId) {
    await dbRun('DELETE FROM user_sessions WHERE userId = ?', [userId]);
  }

  static async revokeAllSessions(userId) { // helper if needed later
    await dbRun('UPDATE user_sessions SET revoked = 1 WHERE userId = ?', [userId]);
  }

  static async touch(userId) {
    await dbRun('UPDATE user_sessions SET lastSeenAt = CURRENT_TIMESTAMP WHERE userId = ?', [userId]);
  }
}

export default SessionService;
