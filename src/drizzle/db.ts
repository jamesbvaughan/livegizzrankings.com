// eslint-disable-next-line no-unassigned-import
import "@/drizzle/envConfig";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleWebsocket } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

const postgresUrl = process.env.DATABASE_URL!;

export const db = drizzleWebsocket(postgresUrl, { schema });

export type DrizzleClient = NeonDatabase<typeof schema>;
