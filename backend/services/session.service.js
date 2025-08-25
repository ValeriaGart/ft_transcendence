import { randomUUID } from 'crypto';
import { log, DEBUG, WARN } from '../utils/logger.utils.js';
import { dbGet, dbRun, dbAll } from '../config/database.js';
import { getAuthConfig } from '../config/auth.config.js';

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
      log(`[SessionService.ensureSchema] failed to inspect schema: ${e.message}`, WARN);
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
      log(`[SessionService.startSession] DB error: ${e.message}`, WARN);
      throw e;
    }
    return { sessionId };
  }

  static async getActiveSession(userId) {
    const session = await dbGet('SELECT userId, sessionId, createdAt, lastSeenAt, revoked FROM user_sessions WHERE userId = ? AND revoked = 0', [userId]);
    
    if (!session) return null;

    // Check inactivity timeout
    const config = getAuthConfig();
    // SQLite CURRENT_TIMESTAMP is UTC without timezone; parse as UTC
    const lastSeenAt = new Date(`${String(session.lastSeenAt).replace(' ', 'T')}Z`);
    const now = new Date();
    const inactivityDuration = now.getTime() - lastSeenAt.getTime();
    
    if (inactivityDuration > config.SESSION.INACTIVITY_TIMEOUT) {
      log(`[SessionService] Active session expired due to inactivity user=${userId} lastSeen=${lastSeenAt}`, WARN);
      // Revoke the inactive session
      await this.revokeAllSessions(userId);
      return null;
    }

    return session;
  }

  static async validateSession(userId, sessionId) {
    const row = await dbGet('SELECT sessionId, revoked, lastSeenAt FROM user_sessions WHERE userId = ?', [userId]);
    
    if (!row || row.sessionId !== sessionId || row.revoked === 1) {
      log(`[SessionService] validateSession failed user=${userId} provided=${sessionId} stored=${row?.sessionId}`, WARN);
      return false;
    }

    // Check inactivity timeout
    const config = getAuthConfig();
    // SQLite CURRENT_TIMESTAMP is UTC without timezone; parse as UTC
    const lastSeenAt = new Date(`${String(row.lastSeenAt).replace(' ', 'T')}Z`);
    const now = new Date();
    const inactivityDuration = now.getTime() - lastSeenAt.getTime();
    
    if (inactivityDuration > config.SESSION.INACTIVITY_TIMEOUT) {
      log(`[SessionService] Session expired due to inactivity user=${userId} lastSeen=${lastSeenAt} inactivity=${inactivityDuration}ms`, WARN);
      // Mark session as revoked due to inactivity
      await this.revokeAllSessions(userId);
      return false;
    }

    return true;
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
