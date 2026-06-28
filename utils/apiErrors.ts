export function extractApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred"
): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const axiosError = error as {
    response?: {
      data?: unknown;
      status?: number;
    };
    message?: string;
  };

  const data = axiosError.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }

    if (record.fields && typeof record.fields === "object") {
      const fieldMessages = Object.values(record.fields as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

      if (fieldMessages.length > 0) {
        return fieldMessages.join("\n");
      }
    }
  }

  if (axiosError.message && !axiosError.message.startsWith("Request failed with status code")) {
    return axiosError.message;
  }

  if (axiosError.response?.status) {
    return `Request failed (${axiosError.response.status})`;
  }

  return fallback;
}
