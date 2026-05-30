// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import { checkRedisHealth } from "@/lib/redis";

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
    },
  };

  const isHealthy = Object.values(health.checks).every((check) => check === true);

  if (!isHealthy) {
    health.status = "unhealthy";
    return NextResponse.json(health, { status: 503 });
  }

  return NextResponse.json(health);
}
