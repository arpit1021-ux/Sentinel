import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

/**
 * Sends the trusted-contact alert as a direct SMS publish (no topic needed —
 * this is a one-to-one alert, not a broadcast). Never invoked unless
 * SENTINEL_MODE=live and ALERT_PHONE_NUMBER is set — see route.ts.
 */
let client: SNSClient | null = null;
function getClient(): SNSClient {
  if (!client) client = new SNSClient({ region: process.env.AWS_REGION ?? "ap-south-1" });
  return client;
}

export async function sendTrustedContactAlert(message: string): Promise<void> {
  const phoneNumber = process.env.ALERT_PHONE_NUMBER;
  if (!phoneNumber) throw new Error("ALERT_PHONE_NUMBER is not configured");

  await getClient().send(
    new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
    }),
  );
}
