import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";

import { listYardsProcedure } from "./routes/yards/list";
import { createYardProcedure } from "./routes/yards/create";
import { updateYardProcedure } from "./routes/yards/update";
import { deleteYardProcedure } from "./routes/yards/delete";

import { listHivesProcedure } from "./routes/hives/list";
import { createHiveProcedure } from "./routes/hives/create";
import { updateHiveProcedure } from "./routes/hives/update";
import { deleteHiveProcedure } from "./routes/hives/delete";

import { listTasksProcedure } from "./routes/tasks/list";
import { createTaskProcedure } from "./routes/tasks/create";
import { updateTaskProcedure } from "./routes/tasks/update";
import { deleteTaskProcedure } from "./routes/tasks/delete";

import { listInspectionsProcedure } from "./routes/inspections/list";
import { createInspectionProcedure } from "./routes/inspections/create";

import { listQueensProcedure } from "./routes/queens/list";
import { createQueenProcedure } from "./routes/queens/create";

import { listHarvestsProcedure } from "./routes/harvests/list";
import { createHarvestProcedure } from "./routes/harvests/create";

import { listInventoryProcedure } from "./routes/inventory/list";
import { createInventoryItemProcedure } from "./routes/inventory/create";
import { updateInventoryItemProcedure } from "./routes/inventory/update";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  yards: createTRPCRouter({
    list: listYardsProcedure,
    create: createYardProcedure,
    update: updateYardProcedure,
    delete: deleteYardProcedure,
  }),
  hives: createTRPCRouter({
    list: listHivesProcedure,
    create: createHiveProcedure,
    update: updateHiveProcedure,
    delete: deleteHiveProcedure,
  }),
  tasks: createTRPCRouter({
    list: listTasksProcedure,
    create: createTaskProcedure,
    update: updateTaskProcedure,
    delete: deleteTaskProcedure,
  }),
  inspections: createTRPCRouter({
    list: listInspectionsProcedure,
    create: createInspectionProcedure,
  }),
  queens: createTRPCRouter({
    list: listQueensProcedure,
    create: createQueenProcedure,
  }),
  harvests: createTRPCRouter({
    list: listHarvestsProcedure,
    create: createHarvestProcedure,
  }),
  inventory: createTRPCRouter({
    list: listInventoryProcedure,
    create: createInventoryItemProcedure,
    update: updateInventoryItemProcedure,
  }),
});

export type AppRouter = typeof appRouter;
