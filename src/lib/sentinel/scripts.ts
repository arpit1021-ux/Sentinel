import type { CallScript } from "./types.ts";

export const SCAM_CALL: CallScript = {
  id: "scam-electricity",
  label: "Play scam call",
  groundTruth: "scam",
  lines: [
    { atMs: 0, speaker: "caller", text: "Good evening, I am calling from the Electricity Department, this is urgent." },
    { atMs: 2500, speaker: "caller", text: "Your connection will be disconnected tonight, you must act right now." },
    { atMs: 6000, speaker: "you", text: "Disconnected? I paid my bill last week." },
    { atMs: 9000, speaker: "caller", text: "Sir there is a case number registered against your meter, this is a police matter now." },
    { atMs: 13000, speaker: "caller", text: "Do not tell anyone about this call, not even your family, this is a confidential investigation." },
    { atMs: 18000, speaker: "you", text: "Okay, what do you need from me?" },
    { atMs: 21000, speaker: "caller", text: "Please stay on the line, do not hang up while I transfer you to the officer." },
    { atMs: 25000, speaker: "caller", text: "Sir, to verify your identity please share the OTP that was just sent to you." },
    { atMs: 30000, speaker: "you", text: "I got a code, should I read it out?" },
    { atMs: 32000, speaker: "caller", text: "Yes, read it now, we don't have much time." },
    { atMs: 36000, speaker: "caller", text: "Now you must transfer the amount of fifteen thousand rupees to this safe account immediately to avoid arrest." },
  ],
};

export const BENIGN_CALL: CallScript = {
  id: "benign-bank",
  label: "Play benign call",
  groundTruth: "benign",
  lines: [
    { atMs: 0, speaker: "caller", text: "Hello, this is your bank's fraud prevention team, calling about a recent card transaction." },
    { atMs: 3000, speaker: "caller", text: "We noticed a purchase abroad and wanted to confirm it was you." },
    { atMs: 7000, speaker: "you", text: "Yes actually, I was travelling last week, that was me." },
    { atMs: 10000, speaker: "caller", text: "Understood, thank you for confirming. Just so you know, we will never ask you for your OTP or PIN over a call." },
    { atMs: 15000, speaker: "caller", text: "If anyone else ever asks, please do not share it with them." },
    { atMs: 19000, speaker: "you", text: "Good to know, thank you." },
    { atMs: 21000, speaker: "caller", text: "No problem at all. Have a good evening." },
  ],
};

export const CALL_SCRIPTS: CallScript[] = [SCAM_CALL, BENIGN_CALL];
