// nestia configuration file
import type sdk from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { MyGlobal } from "./src/MyGlobal";
import { MyModule } from "./src/MyModule";

const NESTIA_CONFIG: sdk.INestiaConfig = {
  input: () => NestFactory.create(MyModule),
  output: "src/api",
  swagger: {
    output: "packages/api/swagger.json",
    servers: [
      {
        url: `http://localhost:${MyGlobal.env.API_PORT}`,
        description: "Local Server",
      },
    ],
    beautify: true,
  },
  distribute: "packages/api",
  primitive: true,
  simulate: true,
  clone: true,
};
export default NESTIA_CONFIG;
