import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TasksService } from "../../scheduler/TasksService";
import { ReportsModule } from "../reports/ReportsModule";

@Module({
  imports: [ScheduleModule.forRoot(), ReportsModule],
  providers: [TasksService],
})
export class SchedulerModule {}