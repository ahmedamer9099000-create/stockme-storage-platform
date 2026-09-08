"use client";

import { useState } from "react";

export function useApiForm<T>(onSuccess: (data: T) => void) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(url: string, body: unknown, method: string = "POST") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "حدث خطأ غير متوقع");
        return;
      }
      onSuccess(json.data as T);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return { submit, error, loading };
}
