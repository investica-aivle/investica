import { Injectable, Logger } from "@nestjs/common";
import { IKisSessionData } from "@models/KisTrading";
import { randomUUID } from "crypto";

export interface ISessionData {
  id: string;
  sessionKey: string; // 클라이언트에게 제공할 세션 키
  kisSessionData: IKisSessionData;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}

@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);
  private readonly sessions = new Map<string, ISessionData>(); // sessionId -> ISessionData
  private readonly sessionKeys = new Map<string, string>(); // sessionKey -> sessionId

  constructor() {
    // 만료된 세션 정리를 위한 주기적 실행 (5분마다)
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * 새 세션 생성
   */
  createSession(
    kisSessionData: IKisSessionData,
  ): { sessionId: string; sessionKey: string } {
    const sessionId = this.generateSessionId();
    const sessionKey = this.generateSessionKey();
    const now = new Date();

    const sessionData: ISessionData = {
      id: sessionId,
      sessionKey,
      kisSessionData,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: new Date(kisSessionData.expiresAt),
    };

    this.sessions.set(sessionId, sessionData);
    this.sessionKeys.set(sessionKey, sessionId);

    this.logger.log(`세션 생성: ${sessionId} (키: ${sessionKey.substring(0, 8)}..., 계좌: ${this.maskAccountNumber(kisSessionData.accountNumber)})`);
    return { sessionId, sessionKey };
  }

  /**
   * 세션 키로 세션 조회
   */
  getSessionByKey(sessionKey: string): ISessionData | null {
    const sessionId = this.sessionKeys.get(sessionKey);
    if (!sessionId) {
      return null;
    }
    return this.getSession(sessionId);
  }

  /**
   * 세션 ID로 세션 조회
   */
  getSession(sessionId: string): ISessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // 만료된 세션 확인
    if (session.expiresAt <= new Date()) {
      this.removeSession(sessionId);
      return null;
    }

    // 마지막 접근 시간 업데이트
    session.lastAccessedAt = new Date();
    return session;
  }

  /**
   * KIS 세션 데이터 조회
   */
  getKisSessionData(sessionId: string): IKisSessionData | null {
    const session = this.getSession(sessionId);
    return session?.kisSessionData || null;
  }

  /**
   * 세션 제거
   */
  removeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    this.sessions.delete(sessionId);
    this.sessionKeys.delete(session.sessionKey);

    this.logger.log(`세션 제거: ${sessionId} (키: ${session.sessionKey.substring(0, 8)}..., 계좌: ${this.maskAccountNumber(session.kisSessionData.accountNumber)})`);
    return true;
  }

  /**
   * 활성 세션 수 조회
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 만료된 세션 정리
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt <= now) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => this.removeSession(sessionId));

    if (expiredSessions.length > 0) {
      this.logger.log(`만료된 세션 ${expiredSessions.length}개 정리 완료`);
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 세션 키 생성 (클라이언트에게 제공)
   */
  private generateSessionKey(): string {
    return randomUUID().replace(/-/g, '');
  }

  /**
   * 계좌번호 마스킹
   */
  private maskAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/(\d{4})\d+(\d{2})/, "$1****$2");
  }
}
