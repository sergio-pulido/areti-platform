import type { ContentStatus } from "@/lib/backend-api";

type LessonFieldValues = {
  slug?: string;
  title?: string;
  tradition?: string;
  level?: string;
  minutes?: number;
  summary?: string;
  content?: string;
};

type PracticeFieldValues = {
  slug?: string;
  title?: string;
  description?: string;
  cadence?: string;
  protocol?: string;
};

type StatusFieldProps = {
  includeStatus?: boolean;
  defaultStatus?: ContentStatus;
};

type LessonFormFieldsProps = StatusFieldProps & {
  values?: LessonFieldValues;
  compact?: boolean;
};

type PracticeFormFieldsProps = StatusFieldProps & {
  values?: PracticeFieldValues;
  compact?: boolean;
};

const baseInputClassName =
  "rounded-lg border border-night-700 bg-night-950 px-3 py-2";
const compactInputClassName =
  "rounded-md border border-night-700 bg-night-900 px-2 py-1";

function fieldClass(compact: boolean): string {
  return compact ? compactInputClassName : baseInputClassName;
}

function StatusField({
  includeStatus = true,
  defaultStatus = "DRAFT",
  compact = false,
}: StatusFieldProps & { compact?: boolean }) {
  if (!includeStatus) {
    return null;
  }

  return (
    <select
      name="status"
      defaultValue={defaultStatus}
      className={fieldClass(compact)}
    >
      <option value="DRAFT">DRAFT</option>
      <option value="PUBLISHED">PUBLISHED</option>
    </select>
  );
}

export function LessonFormFields({
  values,
  includeStatus = true,
  defaultStatus = "DRAFT",
  compact = false,
}: LessonFormFieldsProps) {
  const cls = fieldClass(compact);

  return (
    <>
      <input
        name="slug"
        required
        placeholder="slug"
        defaultValue={values?.slug}
        className={cls}
      />
      <input
        name="title"
        required
        placeholder="title"
        defaultValue={values?.title}
        className={cls}
      />
      <input
        name="tradition"
        required
        placeholder="tradition"
        defaultValue={values?.tradition}
        className={cls}
      />
      <input
        name="level"
        required
        placeholder="level"
        defaultValue={values?.level}
        className={cls}
      />
      <input
        name="minutes"
        type="number"
        min={1}
        required
        placeholder="minutes"
        defaultValue={values?.minutes}
        className={cls}
      />
      <textarea
        name="summary"
        required
        placeholder="summary"
        defaultValue={values?.summary}
        className={cls}
        rows={compact ? 2 : 3}
      />
      <textarea
        name="content"
        required
        placeholder="content"
        defaultValue={values?.content}
        className={cls}
        rows={compact ? 5 : 8}
      />
      <StatusField
        includeStatus={includeStatus}
        defaultStatus={defaultStatus}
        compact={compact}
      />
    </>
  );
}

export function PracticeFormFields({
  values,
  includeStatus = true,
  defaultStatus = "DRAFT",
  compact = false,
}: PracticeFormFieldsProps) {
  const cls = fieldClass(compact);

  return (
    <>
      <input
        name="slug"
        required
        placeholder="slug"
        defaultValue={values?.slug}
        className={cls}
      />
      <input
        name="title"
        required
        placeholder="title"
        defaultValue={values?.title}
        className={cls}
      />
      <textarea
        name="description"
        required
        placeholder="description"
        defaultValue={values?.description}
        className={cls}
        rows={compact ? 2 : 3}
      />
      <input
        name="cadence"
        required
        placeholder="cadence"
        defaultValue={values?.cadence}
        className={cls}
      />
      <textarea
        name="protocol"
        required
        placeholder="protocol"
        defaultValue={values?.protocol}
        className={cls}
        rows={compact ? 5 : 8}
      />
      <StatusField
        includeStatus={includeStatus}
        defaultStatus={defaultStatus}
        compact={compact}
      />
    </>
  );
}
