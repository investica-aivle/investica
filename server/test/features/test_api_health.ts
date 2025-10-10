import { IConnection } from "@nestia/fetcher";

export const test_api_health = async (
  connection: IConnection,
): Promise<void> => {
  // 실제 API 호출 테스트
  try {
    const response = await fetch(`${connection.host}/api/reports/summary`);
    if (response.ok) {
      console.log("API 테스트 성공");
    } else {
      console.log("API 테스트 실패:", response.status);
    }
  } catch (error) {
    console.log("API 테스트 에러:", error);
  }
};
