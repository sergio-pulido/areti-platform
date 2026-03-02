"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createJournalEntry } from "@/actions/journal";
import { initialJournalActionState } from "@/actions/journal-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-medium text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Reflection"}
    </button>
  );
}

export function JournalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createJournalEntry, initialJournalActionState);

  useEffect(() => {
    if (!state.error) {
      formRef.current?.reset();
    }
  }, [state.error]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-3xl border border-night-800 bg-night-900/70 p-5">
      <h2 className="text-lg font-semibold text-sand-100">New Reflection</h2>

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm text-sand-200">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder="What challenged me today?"
          className="w-full rounded-xl border border-night-700 bg-night-950 px-4 py-2.5 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="mood" className="text-sm text-sand-200">
          Mood
        </label>
        <select
          id="mood"
          name="mood"
          defaultValue="Grounded"
          className="w-full rounded-xl border border-night-700 bg-night-950 px-4 py-2.5 text-sm text-sand-100 focus:border-sage-300 focus:outline-none"
        >
          <option>Grounded</option>
          <option>Grateful</option>
          <option>Restless</option>
          <option>Anxious</option>
          <option>Focused</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="body" className="text-sm text-sand-200">
          Reflection
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          maxLength={3000}
          placeholder="Write your thoughts, what was under your control, and one action for tomorrow."
          className="w-full rounded-xl border border-night-700 bg-night-950 px-4 py-3 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
        />
      </div>

      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}
