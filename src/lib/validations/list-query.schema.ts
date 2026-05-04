/**
 * @file list-query.schema.ts
 * @description Zod schemas for shared list API query params (pagination and optional search).
 */

import * as z from "zod";

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/constants";

export const listPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .optional()
    .transform((value) => {
      const resolved = value ?? DEFAULT_PAGE_SIZE;
      return (PAGE_SIZE_OPTIONS as readonly number[]).includes(resolved)
        ? resolved
        : DEFAULT_PAGE_SIZE;
    }),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type ListPaginationQuery = z.infer<typeof listPaginationQuerySchema>;

/**
 * Parses pagination (+ optional search) from a request URL's query string.
 * Returns a Zod error object when `page` is invalid (non-integer or below 1).
 */
export const parseListPaginationFromUrl = (requestUrl: string) => {
  const { searchParams } = new URL(requestUrl);
  const record: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    record[key] = value;
  });
  return listPaginationQuerySchema.safeParse(record);
};
