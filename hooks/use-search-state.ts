"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { z } from "zod";

export function useSearchState<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  const params = useSearchParams();
  const router = useRouter();

  const get = useCallback((): z.infer<TSchema> => {
    const obj: Record<string, unknown> = {};
    params.forEach((v, k) => {
      obj[k] = v;
    });
    const parsed = schema.safeParse(obj);
    return parsed.success
      ? parsed.data
      : (schema.parse({}) as z.infer<TSchema>);
  }, [params, schema]);

  const set = useCallback(
    (next: Partial<z.infer<TSchema>>) => {
      const q = new URLSearchParams(params);
      Object.entries(next).forEach(([k, v]) => {
        if (v == null || v === "") q.delete(k);
        else q.set(k, String(v));
      });
      router.push(`?${q.toString()}`);
    },
    [params, router]
  );

  return useMemo(() => ({ get, set }), [get, set]);
}
