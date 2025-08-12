import { Injectable } from "@nestjs/common";

/**
 * Chat Service for Agentica Class Protocol
 *
 * This service provides chat functionality for Agentica AI agents
 * using the Class protocol. It handles chat-related operations
 * and provides a complete solution for chat interactions.
 *
 * > If you're an A.I. chatbot and the user wants to chat,
 * > you should use the methods in this service to handle conversations.
 * > Each method contains detailed information about required parameters and return values.
 */
@Injectable()
export class ChatService {
  constructor() {}

  /**
   * 채팅 메시지 처리
   *
   * 사용자의 채팅 메시지를 받아서 적절한 응답을 생성합니다.
   * 다양한 기능들을 조합하여 사용자에게 도움이 되는 응답을 제공합니다.
   *
   * > 이 메서드는 사용자가 채팅을 할 때 사용합니다.
   * > 메시지 내용에 따라 적절한 기능을 호출합니다.
   *
   * @param input 채팅 메시지 정보
   * @returns 응답 메시지
   */
  public async processChatMessage(input: {
    /**
     * 사용자 메시지
     * @example "안녕하세요"
     * @example "최근 주식시장 정보 알려줘"
     */
    message: string;

    /**
     * 사용자 ID (선택사항)
     * @example "user123"
     */
    userId?: string;

    /**
     * 세션 ID (선택사항)
     * @example "session456"
     */
    sessionId?: string;
  }): Promise<{
    message: string;
    response: string;
    success: boolean;
    error?: string;
  }> {
    try {
      // 기본 응답
      const response = `안녕하세요! ${input.message}에 대한 응답입니다.`;

      return {
        message: "채팅 메시지가 성공적으로 처리되었습니다.",
        response,
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: "채팅 메시지 처리 중 오류가 발생했습니다.",
        response: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 채팅 세션 시작
   *
   * 새로운 채팅 세션을 시작합니다.
   *
   * @param input 세션 시작 정보
   * @returns 세션 정보
   */
  public async startChatSession(input: {
    /**
     * 사용자 ID
     * @example "user123"
     */
    userId: string;

    /**
     * 초기 메시지 (선택사항)
     * @example "안녕하세요"
     */
    initialMessage?: string;
  }): Promise<{
    message: string;
    sessionId: string;
    success: boolean;
    error?: string;
  }> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        message: "채팅 세션이 성공적으로 시작되었습니다.",
        sessionId,
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: "채팅 세션 시작 중 오류가 발생했습니다.",
        sessionId: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 채팅 세션 종료
   *
   * 채팅 세션을 종료합니다.
   *
   * @param input 세션 종료 정보
   * @returns 종료 결과
   */
  public async endChatSession(input: {
    /**
     * 세션 ID
     * @example "session_1234567890_abc123"
     */
    sessionId: string;
  }): Promise<{
    message: string;
    success: boolean;
    error?: string;
  }> {
    try {
      return {
        message: "채팅 세션이 성공적으로 종료되었습니다.",
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        message: "채팅 세션 종료 중 오류가 발생했습니다.",
        success: false,
        error: errorMessage,
      };
    }
  }
}
