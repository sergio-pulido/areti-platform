import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { ReflectionCard } from "@/components/reflections/reflection-card";
import { ReflectionEmptyState } from "@/components/reflections/reflection-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireSession } from "@/lib/auth/session";
import { apiReflectionsList, type ApiReflectionStatus } from "@/lib/backend-api";

type ReflectionsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    favorite?: string;
    status?: string;
  }>;
};

function parseStatus(value?: string): ApiReflectionStatus | undefined {
  if (value === "draft" || value === "processing" || value === "ready" || value === "failed") {
    return value;
  }
  return undefined;
}

function parsePage(value?: string): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function ReflectionsPage({ searchParams }: ReflectionsPageProps) {
  const params = await searchParams;
  const session = await requireSession();
  const page = parsePage(params.page);
  const status = parseStatus(params.status);
  const favorite = params.favorite === "true" ? true : undefined;
  const q = params.q?.trim() || undefined;

  const data = await apiReflectionsList(session.accessToken, {
    page,
    pageSize: 12,
    q,
    favorite,
    status,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Reflections"
        title="Reflection history"
        description="Capture voice or text, then revisit cleaner transcripts, refined writing, and a short calm commentary."
        actions={
          <Link href="/reflections/new">
            <Button>New reflection</Button>
          </Link>
        }
      />

      <form className="mb-4 grid gap-3 rounded-2xl border border-night-700 bg-night-900/70 p-4 md:grid-cols-[1fr_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Search reflections" />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-xl border border-night-700 bg-night-950 px-3 text-sm text-sand-100"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-night-700 bg-night-950 px-3 text-sm text-night-200">
          <input type="checkbox" name="favorite" value="true" defaultChecked={favorite === true} />
          Favorites only
        </label>
        <Button type="submit" className="md:col-span-3 md:w-fit">
          Apply filters
        </Button>
      </form>

      {data.items.length === 0 ? (
        <ReflectionEmptyState />
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <ReflectionCard key={item.id} item={item} />
          ))}

          <div className="flex items-center justify-between rounded-2xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-night-200">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.totalItems} reflections
            </span>
            <div className="flex items-center gap-2">
              {data.pagination.page > 1 ? (
                <Link
                  href={`/reflections?page=${data.pagination.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}${favorite ? "&favorite=true" : ""}`}
                >
                  <Button size="sm" variant="secondary">
                    Previous
                  </Button>
                </Link>
              ) : null}
              {data.pagination.page < data.pagination.totalPages ? (
                <Link
                  href={`/reflections?page=${data.pagination.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${status}` : ""}${favorite ? "&favorite=true" : ""}`}
                >
                  <Button size="sm" variant="secondary">
                    Next
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
