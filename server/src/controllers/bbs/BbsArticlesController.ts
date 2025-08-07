import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { IBbsArticle } from "../../api/structures/bbs/IBbsArticle";
import { IPage } from "../../api/structures/common/IPage";
import { BbsService } from "../../providers/bbs/BbsService";

/**
 * BBS Articles Controller
 *
 * 게시글 관련 API 엔드포인트를 제공합니다.
 * Agentica와의 통신을 위한 REST API를 제공합니다.
 */
@Controller("bbs/articles/:section")
export class BbsArticlesController {
  constructor(private readonly bbsService: BbsService) {}

  /**
   * 게시글 목록 조회
   *
   * 특정 섹션의 게시글 목록을 페이지네이션과 함께 조회합니다.
   * 검색 및 정렬 기능을 제공합니다.
   *
   * @param section 게시판 섹션
   * @param input 페이지 요청 정보 (검색 및 정렬 옵션 포함)
   * @returns 페이지네이션된 게시글 목록
   */
  @core.TypedRoute.Patch()
  public async index(
    @core.TypedParam("section") section: string,
    @core.TypedBody() input: IBbsArticle.IRequest,
  ): Promise<IPage<IBbsArticle.ISummary>> {
    const result = await this.bbsService.getArticleList({
      section,
      request: input,
    });
    return result.data;
  }

  /**
   * 게시글 상세 조회
   *
   * 특정 게시글의 상세 정보를 조회합니다.
   * 조회 시 읽기 수가 증가합니다.
   *
   * @param section 게시판 섹션
   * @param id 게시글 ID
   * @returns 게시글 상세 정보
   */
  @core.TypedRoute.Get(":id")
  public async at(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string,
  ): Promise<IBbsArticle> {
    const result = await this.bbsService.getArticle({
      section,
      id,
    });
    return result.data;
  }

  /**
   * 게시글 작성
   *
   * 새로운 게시글을 작성합니다.
   *
   * @param section 게시판 섹션
   * @param input 새 게시글 정보
   * @returns 새로 작성된 게시글 정보
   */
  @core.TypedRoute.Post()
  public async create(
    @core.TypedParam("section") section: string,
    @core.TypedBody() input: IBbsArticle.ICreate,
  ): Promise<IBbsArticle> {
    const result = await this.bbsService.createArticle({
      section,
      article: input,
    });
    return result.data;
  }

  /**
   * 게시글 수정
   *
   * 기존 게시글을 수정합니다.
   * 이 BBS 시스템은 내용을 덮어쓰지 않고 누적합니다.
   *
   * @param section 게시판 섹션
   * @param id 게시글 ID
   * @param input 수정할 내용
   * @returns 새로 생성된 스냅샷 정보
   */
  @core.TypedRoute.Put(":id")
  public async update(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody() input: IBbsArticle.IUpdate,
  ): Promise<IBbsArticle.ISnapshot> {
    const result = await this.bbsService.updateArticle({
      section,
      id,
      update: input,
    });
    return result.data;
  }

  /**
   * 게시글 삭제
   *
   * 특정 비밀번호로 게시글을 삭제합니다.
   *
   * @param section 게시판 섹션
   * @param id 게시글 ID
   * @param input 삭제 비밀번호
   */
  @core.TypedRoute.Delete(":id")
  public async erase(
    @core.TypedParam("section") section: string,
    @core.TypedParam("id") id: string,
    @core.TypedBody() input: IBbsArticle.IErase,
  ): Promise<void> {
    await this.bbsService.deleteArticle({
      section,
      id,
      password: input.password,
    });
  }
}
