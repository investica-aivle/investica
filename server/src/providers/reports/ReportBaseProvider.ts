import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";


@Injectable()
export class ReportBaseProvider {
  public readonly genAI: GoogleGenerativeAI;
  public readonly tempDir = path.join(os.tmpdir(), "temp_files");

  constructor(
    public readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>("GOOGLE_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException("Google API Key not found in configuration.");
    } else {
      console.log(`GOOGLE_API_KEY 설정됨`);
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // temp_files 디렉토리 생성
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log(`임시 파일 디렉토리 생성: ${this.tempDir}`);
    }
  }

  /**
   * Generative 모델을 호출하고 응답 텍스트를 반환합니다.
   * @param prompt 모델에 전달할 프롬프트
   * @param modelName 사용할 모델 이름 (기본값: "gemini-2.5-flash")
   * @returns 모델 응답 텍스트
   */
  async callGenerativeModel(
    prompt: string | (string | Part) [],
    modelName: string = "gemini-2.5-flash",
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("LLM 호출 실패:", error);
      throw new InternalServerErrorException("AI 모델 호출 중 오류가 발생했습니다.");
    }
  }

  /**
   * Generative 모델을 호출하고 JSON 응답을 파싱합니다.
   * @param prompt 모델에 전달할 프롬프트
   * @param modelName 사용할 모델 이름
   * @returns 파싱된 JSON 객체
   */
  async callGenerativeModelAndParseJson(
    prompt: string | (string | Part) [],
    modelName: string = "gemini-2.5-flash",
  ): Promise<any> {
    try {
      const responseText = await this.callGenerativeModel(prompt, modelName);
      // JSON 블록 추출 또는 전체 텍스트 사용
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // JSON 블록이 없으면, 전체 텍스트에서 JSON 배열/객체 찾기 시도
      const arrayOrObjectMatch = responseText.match(/\s*(\[[\s\S]*\]|\{[\s\S]*\})\s*/);
      if (arrayOrObjectMatch) {
        return JSON.parse(arrayOrObjectMatch[1]);
      }

      throw new Error("응답에서 유효한 JSON을 찾을 수 없습니다.");
    } catch (error) {
      console.error("LLM JSON 응답 파싱 실패:", error);
      throw new InternalServerErrorException("AI 모델의 JSON 응답을 파싱하는 중 오류가 발생했습니다.");
    }
  }
}
