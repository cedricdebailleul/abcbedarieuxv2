"use client";

import type { ReactNode } from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface FormFieldWrapperProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  children: ReactNode;
  description?: string;
}

export function FormFieldWrapper<T extends Record<string, unknown>>({
  form,
  name,
  label,
  children,
  description,
}: FormFieldWrapperProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>{children}</FormControl>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
