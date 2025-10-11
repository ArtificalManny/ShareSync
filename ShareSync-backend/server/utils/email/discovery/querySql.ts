// server/utils/email/discovery/querySql.ts
// Compile-safe SQL/Prisma stub that mirrors the Mongo output shape.
// Replace with a real Prisma implementation when your client is available.

import { scoreProject, type ProjectSignals } from "./score";
import type { DiscoveryResult, DiscoveryItem } from "../types/discovery";

// Arguments you intend to support once Prisma is wired
type Args = {
  limit?: number;
  cursorId?: string | null;     // id to start after
  timeRangeDays?: number;       // default 7
  personalized?: boolean;
  userId?: string | null;
};

// TEMP implementation: return an empty page so TypeScript builds without a Prisma client.
export async function queryDiscoverySql({
  limit = 20,
  cursorId = null,
  timeRangeDays = 7,
  personalized = false,
  userId = null,
}: Args): Promise<DiscoveryResult> {
  // When ready, implement using your Prisma client:
  // const rows = await prisma.project.findMany({ ... });
  // Build DiscoveryItem[] and nextCursor to match Mongo shape.

  const items: DiscoveryItem[] = [];
  const nextCursor: string | null = null;
  return { items, nextCursor };
}
