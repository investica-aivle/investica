import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ISessionData } from '../providers/session/SessionManager';

/**
 * 전체 세션 정보를 가져오는 데코레이터
 *
 * @example
 * ```typescript
 * @Post('logout')
 * @UseGuards(SessionGuard)
 * async logout(@Session() session: ISessionData) {
 *   const accountNumber = session.kisSessionData.accountNumber;
 *   const sessionKey = session.sessionKey;
 *   // session 객체에서 필요한 모든 정보 접근 가능
 * }
 * ```
 */
export const Session = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ISessionData => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);
