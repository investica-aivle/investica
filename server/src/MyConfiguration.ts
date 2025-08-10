import fs from "fs";
import path from "path";

import { MyGlobal } from "./MyGlobal";

export namespace MyConfiguration {
  export const API_PORT = () => {
    const port = Number(MyGlobal.env.API_PORT);
    return isNaN(port) ? 3000 : port;
  };

  export const ROOT = (() => {
    const split: string[] = __dirname.split(path.sep);
    return split.at(-1) === "src" && split.at(-2) === "bin"
      ? path.resolve(__dirname + "/../..")
      : fs.existsSync(__dirname + "/.env")
        ? __dirname
        : path.resolve(__dirname + "/..");
  })();
}
