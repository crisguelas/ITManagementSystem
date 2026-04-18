/**
 * @file utils.ts
 * @description Shared utility functions used throughout the application.
 * Includes class name merging, formatting helpers, and common tools.
 */

import { type ClassValue, clsx } from "clsx";

/**
 * Merges Tailwind CSS class names with conflict resolution.
 * Uses clsx for conditional classes.
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export const cn = (...inputs: ClassValue[]): string => {
  return clsx(inputs);
};

/**
 * Formats a date to a human-readable string.
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  /* Return placeholder if no date provided */
  if (!date) return "—";

  /* Parse string dates into Date objects */
  const dateObj = typeof date === "string" ? new Date(date) : date;

  /* Default format: "Apr 18, 2026" */
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return dateObj.toLocaleDateString("en-US", defaultOptions);
};

/**
 * Formats a date with time included.
 * @param date - Date to format
 * @returns Formatted date-time string: "Apr 18, 2026, 10:30 AM"
 */
export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Generates a URL-safe slug from a string.
 * @param text - Input text
 * @returns Slugified string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Truncates text to a maximum length with ellipsis.
 * @param text - Text to truncate
 * @param maxLength - Maximum character count
 * @returns Truncated text
 */
export const truncate = (text: string, maxLength: number): string => {
  /* Return original text if it's within the limit */
  if (text.length <= maxLength) return text;

  /* Cut at the max length and add ellipsis */
  return text.slice(0, maxLength).trim() + "...";
};

/**
 * Capitalizes the first letter of a string.
 * @param text - Input text
 * @returns Capitalized string
 */
export const capitalize = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formats an enum value for display (e.g., "IN_MAINTENANCE" → "In Maintenance").
 * @param enumValue - Enum string value
 * @returns Human-readable string
 */
export const formatEnumValue = (enumValue: string): string => {
  return enumValue
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
};

/**
 * Formats a title enum to display format (e.g., "DR" → "Dr.").
 * @param title - Title enum value
 * @returns Formatted title string
 */
export const formatTitle = (title: string): string => {
  /* Map enum values to display format */
  const titleMap: Record<string, string> = {
    DR: "Dr.",
    MR: "Mr.",
    MS: "Ms.",
    PROF: "Prof.",
  };
  return titleMap[title] ?? title;
};

/**
 * Generates a full name with title.
 * @param title - Title enum value
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full formatted name: "Dr. John Smith"
 */
export const formatFullName = (
  title: string,
  firstName: string,
  lastName: string
): string => {
  return `${formatTitle(title)} ${firstName} ${lastName}`;
};

/**
 * Delays execution for a specified duration (useful for loading states in dev).
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Safely parses a JSON string, returning null on failure.
 * @param json - JSON string to parse
 * @returns Parsed object or null
 */
export const safeJsonParse = <T>(json: string): T | null => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

/**
 * Generates pagination metadata.
 * @param totalItems - Total number of items
 * @param currentPage - Current page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Pagination metadata object
 */
export const getPaginationMeta = (
  totalItems: number,
  currentPage: number,
  pageSize: number
) => {
  /* Calculate total pages */
  const totalPages = Math.ceil(totalItems / pageSize);

  /* Calculate the range of items shown on current page */
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return {
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
