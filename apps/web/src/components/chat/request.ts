export async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  if (payload.data === undefined) {
    throw new Error("Missing response payload.");
  }

  return payload.data;
}
