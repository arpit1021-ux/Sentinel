import { NextRequest, NextResponse } from "next/server";

const LIVE = process.env.SENTINEL_MODE === "live";

/** Same E.164 shape the client validates against, checked again here since
 *  a request body is never trusted just because the UI already validated it. */
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

/**
 * SENTINEL_MODE=live + a usable phone number routes through Amazon SNS.
 * Otherwise this just logs — nothing is sent, on purpose, so running the
 * console never sends a real SMS by accident.
 *
 * The phone number comes from the request body first (each browser's own
 * trusted-contact setting), falling back to ALERT_PHONE_NUMBER only for a
 * deployment that wants one fixed number regardless of who's using it.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const targetPhone: string | null =
    typeof body.phoneNumber === "string" && PHONE_RE.test(body.phoneNumber)
      ? body.phoneNumber
      : process.env.ALERT_PHONE_NUMBER ?? null;

  const message = `SENTINEL: a call in progress matches a scam pattern (${(body.tactics ?? []).join(", ")}). Check on them now.`;

  if (!targetPhone) {
    console.log("[alert] no trusted contact configured, nothing to notify");
    return NextResponse.json({ status: "failed" }, { status: 400 });
  }

  if (LIVE) {
    try {
      const { sendTrustedContactAlert } = await import("@/lib/aws/sns");
      await sendTrustedContactAlert(message, targetPhone);
      return NextResponse.json({ status: "sent" });
    } catch (err) {
      console.error("[alert] SNS publish failed:", err);
      return NextResponse.json({ status: "failed" }, { status: 502 });
    }
  }

  console.log(`[alert] (simulated, SENTINEL_MODE!=live) would notify ${targetPhone}:`, message);
  return NextResponse.json({ status: "queued" });
}
