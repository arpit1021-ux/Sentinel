import { NextRequest, NextResponse } from "next/server";

const LIVE = process.env.SENTINEL_MODE === "live";

/**
 * SENTINEL_MODE=live + ALERT_PHONE_NUMBER set routes through Amazon SNS.
 * Otherwise this just logs — nothing is sent, on purpose, so running the
 * console never sends a real SMS by accident.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const message = `SENTINEL: a call in progress matches a scam pattern (${(body.tactics ?? []).join(", ")}). Check on them now.`;

  if (LIVE && process.env.ALERT_PHONE_NUMBER) {
    try {
      const { sendTrustedContactAlert } = await import("@/lib/aws/sns");
      await sendTrustedContactAlert(message);
      return NextResponse.json({ status: "sent" });
    } catch (err) {
      console.error("[alert] SNS publish failed:", err);
      return NextResponse.json({ status: "failed" }, { status: 502 });
    }
  }

  console.log("[alert] (simulated, SENTINEL_MODE!=live) would notify trusted contact:", body);
  return NextResponse.json({ status: "queued" });
}
