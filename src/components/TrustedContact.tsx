"use client";

import { useState } from "react";
import { Button } from "./Button";
import { isValidPhone, useTrustedContact } from "@/lib/sentinel/useTrustedContact";

/**
 * Real-world gap this closes: the circuit breaker's "alert my trusted
 * contact" button is meaningless without knowing WHO to alert, and that
 * can't be a single value baked into the deployment — every user has a
 * different daughter, son, or neighbour to call. This is that per-user
 * setting, small enough to be one field.
 */
export function TrustedContact() {
  const contact = useTrustedContact();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);

  if (!contact.ready) {
    return <p className="field-hint">Loading…</p>;
  }

  if (contact.phone && !editing) {
    return (
      <div className="field">
        <p className="field-hint">
          Alerts go to <span className="mono">{contact.phone}</span>
        </p>
        <Button
          type="button"
          onClick={() => {
            setDraft(contact.phone ?? "");
            setEditing(true);
            setTouched(false);
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  const valid = isValidPhone(draft);
  const showError = touched && draft.length > 0 && !valid;

  return (
    <form
      className="field"
      data-error={showError}
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!isValidPhone(draft)) return;
        contact.save(draft);
        setEditing(false);
      }}
    >
      <div className="field-row">
        <input
          type="text"
          value={draft}
          placeholder="+91XXXXXXXXXX"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-label="Trusted contact's phone number"
          autoFocus={editing}
        />
        <Button type="submit" disabled={!isValidPhone(draft)}>
          Save
        </Button>
      </div>
      {showError ? (
        <p className="field-error">Use a full international number, e.g. +91XXXXXXXXXX.</p>
      ) : (
        <p className="field-hint">Who should we alert if a call turns critical?</p>
      )}
    </form>
  );
}
