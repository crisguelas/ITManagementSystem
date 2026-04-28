/**
 * @file global-search.tsx
 * @description Global search input with live suggestions for employees and assets.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResultType = "employee" | "asset";

interface GlobalSearchResult {
  type: SearchResultType;
  id: string;
  href: string;
  label: string;
  subLabel: string;
  matchReason: string;
}

interface SearchResponse {
  success: boolean;
  data?: GlobalSearchResult[];
  error?: string;
}

/**
 * GlobalSearch — Employee-first universal search with suggestion dropdown.
 */
interface GlobalSearchProps {
  className?: string;
  autoFocusInput?: boolean;
  onEscapeKey?: () => void;
}

/**
 * GlobalSearch — Employee-first universal search with suggestion dropdown.
 * Supports optional autofocus and Escape callback for mobile header expansion.
 */
export const GlobalSearch = ({
  className,
  autoFocusInput = false,
  onEscapeKey,
}: GlobalSearchProps) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();
  const hasMinSearchLength = trimmedQuery.length >= 2;

  useEffect(() => {
    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, []);

  useEffect(() => {
    if (!hasMinSearchLength) {
      return;
    }

    let isCancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          credentials: "same-origin",
        });
        const payload = (await response.json()) as SearchResponse;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Search failed");
        }

        if (!isCancelled) {
          setResults(payload.data);
          setIsOpen(true);
          setActiveIndex(payload.data.length > 0 ? 0 : -1);
        }
      } catch (searchError: unknown) {
        if (!isCancelled) {
          setError(searchError instanceof Error ? searchError.message : "Search failed");
          setResults([]);
          setIsOpen(true);
          setActiveIndex(-1);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
    };
  }, [hasMinSearchLength, trimmedQuery]);

  const resultCountLabel = useMemo(() => {
    if (!hasMinSearchLength) return "Type at least 2 characters";
    if (isLoading) return "Searching...";
    if (error) return error;
    return `Found ${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [error, hasMinSearchLength, isLoading, results.length]);

  const goToResult = (result: GlobalSearchResult) => {
    setIsOpen(false);
    router.push(result.href);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!isOpen && event.key === "ArrowDown" && results.length > 0) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => {
        if (results.length === 0) return -1;
        return current >= results.length - 1 ? 0 : current + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => {
        if (results.length === 0) return -1;
        if (current <= 0) return results.length - 1;
        return current - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < results.length) {
        event.preventDefault();
        goToResult(results[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      onEscapeKey?.();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 shadow-sm transition-colors focus-within:border-primary-400">
        <Search className="h-4 w-4 text-primary-600" />
        <input
          type="text"
          autoFocus={autoFocusInput}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (nextQuery.trim().length < 2) {
              setResults([]);
              setError(null);
              setIsLoading(false);
              setActiveIndex(-1);
            }
            setIsOpen(nextQuery.trim().length > 0);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search employee, PC number, email, mobile, or room number"
          className="h-full w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <div className="hidden items-center gap-1 text-xs text-gray-500 md:flex">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{resultCountLabel}</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {!hasMinSearchLength ? (
            <p className="px-4 py-3 text-sm text-gray-500">Enter at least 2 characters to search.</p>
          ) : error ? (
            <p className="px-4 py-3 text-sm text-red-600">{error}</p>
          ) : isLoading ? (
            <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No matches found.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <li key={`${result.type}:${result.id}`}>
                  <Link
                    href={result.href}
                    onClick={(event) => {
                      event.preventDefault();
                      goToResult(result);
                    }}
                    className={`block border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 ${
                      index === activeIndex ? "bg-primary-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-gray-900">{result.label}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-gray-600">
                        {result.type}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">{result.subLabel}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
