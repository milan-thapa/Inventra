// src/app/api/health/ready/route.ts
import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import { checkRedisHealth } from "@/lib/redis";

export async function GET() {
  const checks = {
    database: await checkDatabaseHealth(),
    redis: await checkRedisHealth(),
  };

  const isReady = Object.values(checks).every((check) => check === true);

  if (isReady) {
    return NextResponse.json({ status: "ready" }, { status: 200 });
  }

  return NextResponse.json(
    { status: "not ready", checks },
    { status: 503 }
  );
}
