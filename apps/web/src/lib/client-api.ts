type ApiPayload<T> = {
  data?: T;
  error?: string;
};

export async function parseClientApiData<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiPayload<T>;

  if (!response.ok || payload.data === undefined) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload.data;
}
