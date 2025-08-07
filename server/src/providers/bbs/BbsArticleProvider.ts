import { Injectable } from "@nestjs/common";

import { IBbsArticle } from "../../api/structures/bbs/IBbsArticle";
import { IPage } from "../../api/structures/common/IPage";

/**
 * BBS Article Provider
 *
 * 게시글 관련 기능을 제공하는 내부 Provider입니다.
 * Agentica가 직접 호출하지 않고 Service에서 사용합니다.
 */
@Injectable()
export class BbsArticleProvider {
  constructor() {}

  /**
   * 게시글 목록 조회 (내부용)
   */
  public async index(input: {
    section: string;
    input: IBbsArticle.IRequest;
  }): Promise<IPage<IBbsArticle.ISummary>> {
    // 실제 구현에서는 데이터베이스에서 조회
    return {
      data: [],
      pagination: {
        current: input.input.page || 1,
        limit: input.input.limit || 10,
        records: 0,
        pages: 0,
      },
    };
  }

  /**
   * 게시글 상세 조회 (내부용)
   */
  public async find(input: {
    section: string;
    id: string;
  }): Promise<IBbsArticle> {
    // 실제 구현에서는 데이터베이스에서 조회
    return {} as IBbsArticle;
  }

  /**
   * 게시글 생성 (내부용)
   */
  public async create(input: {
    section: string;
    input: IBbsArticle.ICreate;
  }): Promise<IBbsArticle> {
    // 실제 구현에서는 데이터베이스에 저장
    return {} as IBbsArticle;
  }

  /**
   * 게시글 수정 (내부용)
   */
  public async update(input: {
    section: string;
    id: string;
    input: IBbsArticle.IUpdate;
  }): Promise<IBbsArticle.ISnapshot> {
    // 실제 구현에서는 데이터베이스 업데이트
    return {} as IBbsArticle.ISnapshot;
  }

  /**
   * 게시글 삭제 (내부용)
   */
  public async erase(input: {
    section: string;
    id: string;
    input: IBbsArticle.IErase;
  }): Promise<void> {
    // 실제 구현에서는 데이터베이스에서 삭제
  }
}
