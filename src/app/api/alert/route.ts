import { NextRequest, NextResponse } from "next/server";

/**
 * Placeholder alert route. Tomorrow: publish to an Amazon SNS topic that
 * reaches the trusted contact by SMS. Kept as its own route now so the UI's
 * "alert my family" action already goes over the network and only the inside
 * of this handler changes.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.log("[alert] would notify trusted contact:", body);
  return NextResponse.json({ status: "queued" });
}
