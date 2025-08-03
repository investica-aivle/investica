import { Injectable, Logger } from "@nestjs/common";

export interface IKisAuthRequest {
  accountNumber: string;
  appKey: string;
  appSecret: string;
}

export interface IKisAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface IKisSessionData {
  accountNumber: string;
  appKey: string;
  appSecret: string;
  accessToken: string;
  tokenExpiresAt: Date;
}

@Injectable()
export class KisAuthProvider {
  private readonly logger = new Logger(KisAuthProvider.name);
    private readonly KIS_BASE_URL = "https://openapivts.koreainvestment.com:29443";

  /**
   * 한국투자증권 OAuth 인증을 수행하여 액세스 토큰을 발급받습니다.
   */
  public async authenticate(request: IKisAuthRequest): Promise<IKisSessionData> {
    const maskedAppKey = request.appKey.substring(0, 8) + '***';
    const maskedAccountNumber = request.accountNumber.replace(/(\d{4})\d+(\d{2})/, '$1****$2');
    
    this.logger.log(`Starting KIS authentication for account: ${maskedAccountNumber}, appKey: ${maskedAppKey}`);

    try {
      const requestBody = {
        grant_type: "client_credentials",
        appkey: request.appKey,
        appsecret: request.appSecret,
      };

      this.logger.debug(`Sending OAuth request to: ${this.KIS_BASE_URL}/oauth2/tokenP`);

      const response = await fetch(`${this.KIS_BASE_URL}/oauth2/tokenP`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      this.logger.debug(`KIS OAuth response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails;
        
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { message: errorText };
        }

        this.logger.error(`KIS OAuth request failed`, {
          status: response.status,
          statusText: response.statusText,
          url: `${this.KIS_BASE_URL}/oauth2/tokenP`,
          accountNumber: maskedAccountNumber,
          appKey: maskedAppKey,
          requestBody: {
            grant_type: "client_credentials",
            appkey: maskedAppKey,
            appsecret: "[HIDDEN]"
          },
          responseHeaders: Object.fromEntries(response.headers.entries()),
          errorDetails
        });

        throw new Error(`KIS OAuth failed: ${response.status} ${response.statusText}`);
      }

      const authResponse: IKisAuthResponse = await response.json();
      
      if (!authResponse.access_token) {
        this.logger.error(`KIS OAuth response missing access_token:`, {
          accountNumber: maskedAccountNumber,
          appKey: maskedAppKey,
          response: authResponse
        });
        throw new Error("OAuth response missing access_token");
      }

      // 토큰 만료 시간 계산 (현재 시간 + expires_in 초)
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + authResponse.expires_in);

      this.logger.log(`KIS authentication successful for account: ${maskedAccountNumber}, token expires at: ${tokenExpiresAt.toISOString()}`);

      return {
        accountNumber: request.accountNumber,
        appKey: request.appKey,
        appSecret: request.appSecret,
        accessToken: authResponse.access_token,
        tokenExpiresAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('KIS OAuth failed')) {
        // 이미 로그가 출력된 KIS OAuth 에러는 다시 로그하지 않음
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`KIS authentication error for account: ${maskedAccountNumber}`, JSON.stringify({
        error: errorMessage,
        stack: errorStack,
        appKey: maskedAppKey,
        errorType: error?.constructor?.name || 'Unknown'
      }, null, 2));

      throw new Error(`KIS authentication failed: ${errorMessage}`);
    }
  }

  /**
   * 토큰이 만료되었는지 확인합니다.
   */
  public isTokenExpired(sessionData: IKisSessionData): boolean {
    return new Date() >= sessionData.tokenExpiresAt;
  }

  /**
   * 토큰이 만료된 경우 재발급을 수행합니다.
   */
  public async refreshTokenIfNeeded(sessionData: IKisSessionData): Promise<IKisSessionData> {
    if (!this.isTokenExpired(sessionData)) {
      return sessionData;
    }

    return await this.authenticate({
      accountNumber: sessionData.accountNumber,
      appKey: sessionData.appKey,
      appSecret: sessionData.appSecret,
    });
  }
}
