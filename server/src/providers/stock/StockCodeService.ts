import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import AdmZip from "adm-zip";
import * as fs from 'fs';
import * as https from 'https';
import * as iconv from "iconv-lite";
import * as path from 'path';



import { StockInfo, StockSearchResult } from '../../types/stock.types';


@Injectable()
export class StockCodeService implements OnModuleInit {
  private readonly logger = new Logger(StockCodeService.name);
  
  // 핵심 데이터 저장소
  private stockByCode = new Map<string, StockInfo>();  // 종목코드로 검색
  private searchIndex = new Map<string, StockInfo[]>(); // 자동완성용 부분일치 검색

  private readonly downloadUrls = {
    kospi: 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip'
  };

  private readonly downloadDir = path.join(process.cwd(), 'downloads', 'stock-codes');

  async onModuleInit() {
    this.logger.log('종목 코드 서비스 초기화 시작...');
    await this.loadStockCodes();
  }

  private async loadStockCodes() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        fs.mkdirSync(this.downloadDir, { recursive: true });
      }

      // 코스피만 로드
      await this.loadMarketData('kospi', this.downloadUrls.kospi);

      // 검색 인덱스 구축
      this.buildSearchIndex();

      this.logger.log(`종목 로딩 완료: 총 ${this.stockByCode.size}개`);
    } catch (error) {
      this.logger.error('종목 로딩 실패:', error);
    }
  }

  private async loadMarketData(market: string, url: string) {
    const zipPath = path.join(this.downloadDir, `${market}.zip`);
    const mstPath = path.join(this.downloadDir, `${market}.mst`);

    try {
      // 다운로드
      await this.downloadFile(url, zipPath);

      // 압축해제
      const zip = new AdmZip(zipPath);
      zip.getEntries().forEach(entry => {
        if (entry.entryName.endsWith('.mst')) {
          zip.extractEntryTo(entry, this.downloadDir, false, true);
          // MST 파일명이 다를 수 있으므로 실제 파일명 확인
          const extractedPath = path.join(this.downloadDir, entry.entryName);
          if (fs.existsSync(extractedPath)) {
            fs.renameSync(extractedPath, mstPath);
          }
        }
      });

      // MST 파일이 존재하는지 확인
      if (!fs.existsSync(mstPath)) {
        throw new Error(`MST 파일을 찾을 수 없습니다: ${mstPath}`);
      }

      // 파싱
      const count = this.parseMstFile(mstPath, market.toUpperCase());
      this.logger.log(`${market.toUpperCase()}: ${count}개 종목 로드`);

      // 임시파일 삭제
      [zipPath, mstPath].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });

    } catch (error) {
      this.logger.error(`${market} 로딩 실패:`, error);
    }
  }

  private async downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);

      https.get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', reject);
      }).on('error', reject);
    });
  }

  private parseMstFile(filePath: string, market: string): number {
    try {
      // Python 코드처럼 파일을 CP949 인코딩으로 텍스트 파일로 읽기
      const fileContent = fs.readFileSync(filePath, { encoding: 'binary' });
      const fileText = iconv.decode(Buffer.from(fileContent, 'binary'), 'cp949');
      const lines = fileText.split('\n');

      let count = 0;
      this.logger.log(`${market} 파일 라인 수: ${lines.length}`);

      for (const row of lines) {
        if (!row.trim()) continue; // 빈 줄 건너뛰기

        try {
          // rf1 = row[0:len(row) - 228]
          const rf1 = row.substring(0, row.length - 228);

          // rf1_1 = rf1[0:9].rstrip() - 단축코드
          const rf1_1 = rf1.substring(0, 9).trimEnd();

          // rf1_2 = rf1[9:21].rstrip() - 표준코드
          const rf1_2 = rf1.substring(9, 21).trimEnd();

          // rf1_3 = rf1[21:].strip() - 한글명
          const rf1_3 = rf1.substring(21).trim();

          const stock = this.createStockFromParsedData(rf1_1, rf1_2, rf1_3, market);
          if (stock) {
            this.stockByCode.set(stock.code, stock);
            count++;
          }
        } catch (error) {
          // 파싱 오류 무시하고 계속
        }
      }

      return count;
    } catch (error) {
      this.logger.error(`${market} 파일 읽기 실패:`, error);
      return 0;
    }
  }

  private createStockFromParsedData(shortCode: string, standardCode: string, name: string, market: string): StockInfo | null {
    // 단축코드에서 종목코드 추출 (숫자만)
    const code = shortCode.replace(/[^\d]/g, '').padStart(6, '0');

    // 종목코드 유효성 검사
    if (!code || !/^\d{6}$/.test(code)) {
      return null;
    }

    // 종목명 기본 유효성 검사만 수행
    if (!name || name.trim().length === 0) {
      return null;
    }

    // 종목명 정리 (앞뒤 공백 제거)
    const cleanName = name.trim();

    return {
      code,
      name: cleanName,
      market: 'KOSPI' as const // 코스피만 사용
    };
  }

  private buildSearchIndex() {
    this.searchIndex.clear();

    for (const stock of this.stockByCode.values()) {
      // 종목명 부분 검색용 인덱스 - 간단하게 수정
      const name = stock.name.toLowerCase();
      
      // 1글자부터 5글자까지만 인덱싱 (성능 개선)
      for (let i = 0; i < name.length && i < 10; i++) {
        for (let j = i + 1; j <= Math.min(name.length, i + 6); j++) {
          const substring = name.substring(i, j);
          if (!this.searchIndex.has(substring)) {
            this.searchIndex.set(substring, []);
          }
          const list = this.searchIndex.get(substring)!;
          if (!list.find(s => s.code === stock.code)) {
            list.push(stock);
          }
        }
      }
    }

    this.logger.log(`검색 인덱스 구축 완료: ${this.searchIndex.size}개 키워드`);
  }

  // === 공개 API ===

  /**
   * 통합 자동완성 검색
   * - 숫자면 종목코드 접두사 검색 (작은 숫자 우선 정렬)
   * - 문자면 종목명 유사도 검색 (유사한 순서로 정렬)
   */
  searchStocks(query: string, limit: number = 10): StockSearchResult[] {
    if (!query?.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();

    // 숫자인지 확인 (종목코드 검색)
    if (/^\d+$/.test(normalizedQuery)) {
      return this.searchByCode(normalizedQuery, limit);
    } else {
      // 문자인 경우 (종목명 검색)
      return this.searchByName(normalizedQuery, limit);
    }
  }

  /**
   * 종목코드 접두사 검색 (작은 숫자 우선 정렬)
   */
  private searchByCode(codePrefix: string, limit: number): StockSearchResult[] {
    const results: StockInfo[] = [];

    for (const [code, stock] of this.stockByCode.entries()) {
      if (code.startsWith(codePrefix)) {
        results.push(stock);
      }
    }

    // 종목코드 숫자 오름차순 정렬 (작은 숫자 우선)
    results.sort((a, b) => parseInt(a.code) - parseInt(b.code));

    // StockSearchResult 형태로 변환
    return results.slice(0, limit).map(stock => ({
      code: stock.code,
      name: stock.name,
      market: stock.market
    }));
  }

  /**
   * 종목명 유사도 검색 (유사한 순서로 정렬)
   */
  private searchByName(nameQuery: string, limit: number): StockSearchResult[] {
    const results = this.searchIndex.get(nameQuery) || [];
    
    // 유사도별 그룹핑
    const exactMatch: StockInfo[] = [];      // 완전일치
    const startsWith: StockInfo[] = [];      // 시작일치
    const contains: StockInfo[] = [];        // 포함일치

    for (const stock of results) {
      const stockName = stock.name.toLowerCase();
      
      if (stockName === nameQuery) {
        exactMatch.push(stock);
      } else if (stockName.startsWith(nameQuery)) {
        startsWith.push(stock);
      } else if (stockName.includes(nameQuery)) {
        contains.push(stock);
      }
    }

    // 우선순위: 완전일치 > 시작일치 > 포함일치
    // 각 그룹 내에서는 종목명 길이 짧은 순서로 정렬
    const sortByLength = (a: StockInfo, b: StockInfo) => a.name.length - b.name.length;
    
    exactMatch.sort(sortByLength);
    startsWith.sort(sortByLength);
    contains.sort(sortByLength);

    // StockSearchResult 형태로 변환
    return [...exactMatch, ...startsWith, ...contains]
      .slice(0, limit)
      .map(stock => ({
        code: stock.code,
        name: stock.name,
        market: stock.market
      }));
  }
}
