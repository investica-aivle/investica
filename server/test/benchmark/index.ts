import { DynamicBenchmarker } from "@nestia/benchmark";
import cliProgress from "cli-progress";
import fs from "fs";
import os from "os";
import { IPointer } from "tstl";

import { MyBackend } from "../../src/MyBackend";
import { MyConfiguration } from "../../src/MyConfiguration";
import { MyGlobal } from "../../src/MyGlobal";
import { ArgumentParser } from "../helpers/ArgumentParser";

interface IOptions {
  include?: string[];
  exclude?: string[];
  count: number;
  threads: number;
  simultaneous: number;
}

const getOptions = () =>
  ArgumentParser.parse<IOptions>(async (command, prompt, action) => {
    // command.option("--mode <string>", "target mode");
    // command.option("--reset <true|false>", "reset local DB or not");
    command.option("--include <string...>", "include feature files");
    command.option("--exclude <string...>", "exclude feature files");
    command.option("--count <number>", "number of requests to make");
    command.option("--threads <number>", "number of threads to use");
    command.option(
      "--simultaneous <number>",
      "number of simultaneous requests to make",
    );
    return action(async (options) => {
      // if (typeof options.reset === "string")
      //     options.reset = options.reset === "true";
      // options.mode ??= await prompt.select("mode")("Select mode")([
      //     "LOCAL",
      //     "DEV",
      //     "REAL",
      // ]);
      // options.reset ??= await prompt.boolean("reset")("Reset local DB");
      options.count = Number(
        options.count ??
          (await prompt.number("count")("Number of requests to make")),
      );
      options.threads = Number(
        options.threads ??
          (await prompt.number("threads")("Number of threads to use")),
      );
      options.simultaneous = Number(
        options.simultaneous ??
          (await prompt.number("simultaneous")(
            "Number of simultaneous requests to make",
          )),
      );
      return options as IOptions;
    });
  });

const main = async (): Promise<void> => {
  console.log("🚀 Agentica 벤치마크 시작");
  MyGlobal.testing = true;

  // Agentica 벤치마크만 실행 (API 벤치마크는 일시적으로 비활성화)
  console.log("\n🤖 Agentica 벤치마크 실행");
  await runAgenticaBenchmark();

  console.log("\n✅ 벤치마크 완료!");
  process.exit(0); // 프로세스 명시적 종료
};

const runApiBenchmark = async (): Promise<void> => {
  // CONFIGURATIONS (기본값 사용)
  const options: IOptions = {
    count: 100,
    threads: 4,
    simultaneous: 10,
  };

  // BACKEND SERVER
  const backend: MyBackend = new MyBackend();
  await backend.open();

  // DO BENCHMARK
  const prev: IPointer<number> = { value: 0 };
  const bar: cliProgress.SingleBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  bar.start(options.count, 0);

  const report: DynamicBenchmarker.IReport = await DynamicBenchmarker.master({
    servant: `${__dirname}/servant.js`,
    count: options.count,
    threads: options.threads,
    simultaneous: options.simultaneous,
    filter: (func) => true, // 모든 함수 포함
    progress: (value: number) => {
      if (value >= 100 + prev.value) {
        bar.update(value);
        prev.value = value;
      }
    },
    stdio: "ignore",
  });
  bar.stop();

  // DOCUMENTATION
  try {
    await fs.promises.mkdir(`${MyConfiguration.ROOT}/docs/benchmarks`, {
      recursive: true,
    });
  } catch {}
  await fs.promises.writeFile(
    `${MyConfiguration.ROOT}/docs/benchmarks/api-${os
      .cpus()[0]
      .model.trim()
      .split("\\")
      .join("")
      .split("/")
      .join("")}.md`,
    DynamicBenchmarker.markdown(report),
    "utf8",
  );

  // CLOSE
  await backend.close();
  console.log("✅ API 벤치마크 완료");
};

const runAgenticaBenchmark = async (): Promise<void> => {
  try {
    // AgenticaBenchmark.ts의 main 함수를 동적으로 import해서 실행
    const { default: agenticaMain } = await import("./AgenticaBenchmark");
    await agenticaMain();
    console.log("✅ Agentica 전체 벤치마크 완료");
  } catch (error) {
    console.error("❌ Agentica 전체 벤치마크 실패:", error);
  }
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
