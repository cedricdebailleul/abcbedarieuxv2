"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function usePagination(defaultPage = 1, defaultSize = 20) {
  const params = useSearchParams();
  const router = useRouter();

  const page = Number(params.get("page") ?? defaultPage);
  const size = Number(params.get("size") ?? defaultSize);

  function setPage(next: number) {
    const q = new URLSearchParams(params);
    q.set("page", String(Math.max(1, next)));
    router.push(`?${q.toString()}`);
  }

  function setSize(next: number) {
    const q = new URLSearchParams(params);
    q.set("size", String(Math.max(1, next)));
    q.set("page", "1");
    router.push(`?${q.toString()}`);
  }

  return useMemo(() => ({ page, size, setPage, setSize }), [page, size]);
}
