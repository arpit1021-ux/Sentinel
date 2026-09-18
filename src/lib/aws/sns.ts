import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

/**
 * Sends the trusted-contact alert as a direct SMS publish (no topic needed —
 * this is a one-to-one alert, not a broadcast). Never invoked unless
 * SENTINEL_MODE=live and a phone number is available — see route.ts, which
 * resolves that number per-request (the caller's own trusted contact, or the
 * ALERT_PHONE_NUMBER fallback).
 */
let client: SNSClient | null = null;
function getClient(): SNSClient {
  if (!client) client = new SNSClient({ region: process.env.AWS_REGION ?? "ap-south-1" });
  return client;
}

export async function sendTrustedContactAlert(message: string, phoneNumber: string): Promise<void> {
  await getClient().send(
    new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
    }),
  );
}
