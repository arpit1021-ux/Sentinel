"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sentinel:trustedContactPhone";

/** E.164: a leading +, then 8-15 digits, first digit non-zero. What SNS
 *  actually requires for PhoneNumber. */
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

/**
 * Without this, "alert my trusted contact" can only ever reach whichever
 * phone number happens to be baked into the server's environment — useless
 * for any real user other than whoever deployed it. Each browser remembers
 * its own contact locally; nothing is sent anywhere until the circuit
 * breaker actually fires.
 */
export function useTrustedContact() {
  const [phone, setPhoneState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setPhoneState(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage unavailable (private browsing, blocked storage, etc.) —
      // the feature just degrades to "not configured" for this session.
    }
    setReady(true);
  }, []);

  const save = useCallback((value: string) => {
    const trimmed = value.trim();
    try {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // best-effort persistence; still works for the rest of this session
    }
    setPhoneState(trimmed);
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setPhoneState(null);
  }, []);

  return { phone, ready, save, clear };
}
