import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import axios, { AxiosResponse } from "axios";
import { MyGlobal } from "../../MyGlobal";

export interface IKisAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  access_token_token_expired: string;
}

@Injectable()
export class KisAuthService implements OnModuleInit {
  private readonly logger = new Logger(KisAuthService.name);
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * 모듈 초기화 시 OAuth 인증을 자동으로 실행합니다.
   */
  async onModuleInit() {
    this.logger.log('한투 OpenAPI OAuth 인증을 시작합니다...');
    try {
      await this.authenticate();
      this.logger.log('한투 OpenAPI OAuth 인증이 성공적으로 완료되었습니다.');
    } catch (error) {
      this.logger.error('한투 OpenAPI OAuth 인증 중 오류가 발생했습니다:', error);
    }
  }

  /**
   * OAuth 인증을 통해 액세스 토큰을 발급받습니다.
   */
  public async authenticate(): Promise<string> {
    // 토큰이 유효한지 확인
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      this.logger.log('기존 토큰이 유효합니다. 재사용합니다.');
      return this.accessToken;
    }

    try {
      const response: AxiosResponse<IKisAuthResponse> = await axios.post(
        'https://openapi.koreainvestment.com:9443/oauth2/tokenP',
        {
          grant_type: 'client_credentials',
          appkey: MyGlobal.env.KIS_APP_KEY,
          appsecret: MyGlobal.env.KIS_APP_SECRET,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { access_token, expires_in, access_token_token_expired } = response.data;

      this.accessToken = access_token;
      // expires_in은 초 단위이므로 현재 시간에 더해서 만료 시간 계산
      this.tokenExpiry = new Date(Date.now() + expires_in * 1000);

      this.logger.log(`토큰 발급 성공. 만료 시간: ${access_token_token_expired}`);

      return this.accessToken;
    } catch (error) {
      this.logger.error('OAuth 인증 실패:', error);
      throw new Error('한투 OpenAPI OAuth 인증에 실패했습니다.');
    }
  }

  /**
   * 현재 유효한 액세스 토큰을 반환합니다.
   * 토큰이 만료되었다면 새로 발급받습니다.
   */
  public async getAccessToken(): Promise<string> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      this.logger.log('토큰이 만료되어 재발급합니다.');
      await this.authenticate();
    }

    return this.accessToken!;
  }

  /**
   * API 호출 시 사용할 Authorization 헤더 값을 반환합니다.
   */
  public async getAuthorizationHeader(): Promise<string> {
    const token = await this.getAccessToken();
    return `Bearer ${token}`;
  }
}
