import { Module } from "@nestjs/common";
import { KisAuthService } from "./KisAuthService";

@Module({
  providers: [KisAuthService],
  exports: [KisAuthService],
})
export class KisModule {}
