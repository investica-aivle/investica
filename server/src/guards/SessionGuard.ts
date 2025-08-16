import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SessionManager } from '../providers/session/SessionManager';
import { ISessionData } from '../providers/session/SessionManager';

// Request 객체에 session 속성 추가를 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      session?: ISessionData;
    }
  }
}

/**
 * 세션 기반 인증 가드
 *
 * Authorization 헤더의 Bearer 토큰(세션 키)을 검증하여
 * 유효한 세션인지 확인합니다.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionManager: SessionManager) {}

  /**
   * 요청이 유효한 세션을 가지고 있는지 확인
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionKey = this.extractSessionKey(request);

    if (!sessionKey) {
      throw new UnauthorizedException('세션 키가 필요합니다. Authorization 헤더를 포함해주세요.');
    }

    const session = this.sessionManager.getSessionByKey(sessionKey);
    if (!session) {
      throw new UnauthorizedException('유효하지 않은 세션입니다. 다시 로그인해주세요.');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    // Request 객체에 세션 정보 저장 (컨트롤러에서 사용 가능)
    request.session = session;

    return true;
  }

  /**
   * Authorization 헤더에서 세션 키 추출
   * 형식: "Bearer <sessionKey>"
   */
  private extractSessionKey(request: Request): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
