"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { z } from "zod";

export function useSearchState<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  const params = useSearchParams();
  const router = useRouter();

  function get(): z.infer<TSchema> {
    const obj: Record<string, unknown> = {};
    params.forEach((v, k) => {
      obj[k] = v;
    });
    const parsed = schema.safeParse(obj);
    return parsed.success ? parsed.data : (schema.parse({}) as any);
  }

  function set(next: Partial<z.infer<TSchema>>) {
    const q = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === "") q.delete(k);
      else q.set(k, String(v));
    });
    router.push(`?${q.toString()}`);
  }

  return useMemo(() => ({ get, set }), [params.toString()]);
}
