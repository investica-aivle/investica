import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Singleton } from "tstl";
import typia from "typia";

/* eslint-disable */
export class MyGlobal {
  public static testing: boolean = false;
  public static get env(): MyGlobal.IEnvironments {
    return environments.get();
  }
}
export namespace MyGlobal {
  export interface IEnvironments {
    API_PORT: `${number}`;
    OPENAI_API_KEY: string;
    // 한국투자증권 OpenAPI 설정
    KIS_APP_KEY: string;
    KIS_APP_SECRET: string;
    KIS_BASE_URL: string;
  }
}

const environments = new Singleton(() => {
  const env = dotenv.config();
  dotenvExpand.expand(env);
  return typia.assert<MyGlobal.IEnvironments>(process.env);
});
