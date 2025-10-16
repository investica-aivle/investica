import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import { Keyword, MiraeAssetReport, KeywordCacheData } from "@models/Reports";

@Injectable()
export class ReportCacheManager {
  private readonly cachePath = "./downloads/summary/keyword_cache.json";
  private readonly summaryDir = "./downloads/summary";

  /**
   * 키워드 캐시 확인
   */
  public checkKeywordCache(files: MiraeAssetReport[]): {
    isValid: boolean;
    keywords: Keyword[];
  } {
    try {
      if (!fs.existsSync(this.cachePath)) {
        return { isValid: false, keywords: [] };
      }

      const cacheContent = fs.readFileSync(this.cachePath, "utf8");
      const cache: KeywordCacheData = JSON.parse(cacheContent);

      // 현재 파일 ID들
      const currentFileIds = files.map((f) => f.id);

      // 캐시된 파일 ID들
      const cachedFileIds = cache.referencedFiles.map((f: any) => f.id);

      // 현재 파일들이 모두 캐시에 포함되어 있는지 확인
      const allFilesInCache = currentFileIds.every((id) =>
        cachedFileIds.includes(id),
      );

      if (!allFilesInCache) {
        console.log("새로운 파일이 포함되어 있어 캐시 무효화");
        return { isValid: false, keywords: [] };
      }

      console.log("모든 파일이 캐시에 포함되어 있어 캐시 사용");
      return { isValid: true, keywords: cache.keywords };
    } catch (error) {
      console.error("캐시 확인 중 오류:", error);
      return { isValid: false, keywords: [] };
    }
  }

  /**
   * 키워드 캐시 저장
   */
  public async saveKeywordCache(
    keywords: Keyword[],
    files: MiraeAssetReport[],
  ): Promise<void> {
    try {
      // summary 디렉토리 생성
      if (!fs.existsSync(this.summaryDir)) {
        fs.mkdirSync(this.summaryDir, { recursive: true });
        console.log(`요약 디렉토리 생성: ${this.summaryDir}`);
      }

      // 기존 캐시 읽기 (있다면)
      let existingCache: KeywordCacheData = {
        keywords: [],
        referencedFiles: [],
        updatedAt: "",
      };
      if (fs.existsSync(this.cachePath)) {
        try {
          const cacheContent = fs.readFileSync(this.cachePath, "utf8");
          existingCache = JSON.parse(cacheContent);
        } catch (error) {
          console.warn("기존 캐시 읽기 실패, 새로 생성합니다.");
        }
      }

      // 기존 파일들과 새 파일들 병합 (중복 제거)
      const existingFileIds = new Set(
        existingCache.referencedFiles.map((f: any) => f.id),
      );
      const newFiles = files.filter((f) => !existingFileIds.has(f.id));

      const allFiles = [...existingCache.referencedFiles, ...newFiles];

      const cacheData: KeywordCacheData = {
        keywords,
        referencedFiles: allFiles,
        updatedAt: new Date().toISOString().split("T")[0],
      };

      fs.writeFileSync(this.cachePath, JSON.stringify(cacheData, null, 2), "utf8");
      console.log(`키워드 캐시 저장 완료: ${this.cachePath} (총 ${allFiles.length}개 파일)`);
    } catch (error) {
      console.error("캐시 저장 중 오류:", error);
    }
  }
}
