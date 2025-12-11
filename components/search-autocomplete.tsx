"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  X,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
} from "@/lib/search-utils";
import Link from "next/link";
import Image from "next/image";

interface SearchSuggestion {
  id: string;
  name: string;
  brand: string | null;
  category: { name: string; slug: string } | null;
  image: string | null;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md" | "lg";
  showSearchButton?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Search products...",
  className = "",
  inputClassName = "",
  size = "md",
  showSearchButton = false,
  inputRef: externalInputRef,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<
    Array<{ query: string; count: number }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsCacheRef = useRef<
    Map<string, { data: SearchSuggestion[]; timestamp: number }>
  >(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load recent searches and trending searches
  useEffect(() => {
    setRecentSearches(getSearchHistory());
    fetchTrendingSearches();
  }, []);

  const fetchTrendingSearches = async () => {
    try {
      const response = await fetch("/api/search/analytics?limit=5");
      if (response.ok) {
        const data = await response.json();
        setTrendingSearches(data.trending || []);
      }
    } catch (error) {
      // Silently fail - trending searches are optional
      console.error("Error fetching trending searches:", error);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value.trim());
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(value.trim().length > 0);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    // Check cache first
    const cached = suggestionsCacheRef.current.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setSuggestions(cached.data);
      setIsOpen(true);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.ok) {
        const data = await response.json();
        const suggestions = data.suggestions || [];

        // Cache the results
        suggestionsCacheRef.current.set(query, {
          data: suggestions,
          timestamp: Date.now(),
        });

        setSuggestions(suggestions);
        setIsOpen(true);
      } else {
        setError("Failed to fetch suggestions. Please try again.");
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching suggestions:", error);
        setError("An error occurred while searching. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Track search analytics
  const trackSearch = async (query: string, resultCount: number = 0) => {
    try {
      await fetch("/api/search/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, resultCount }),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't block user experience
      console.error("Error tracking search:", error);
    }
  };

  const handleSelect = async (query: string) => {
    saveSearchHistory(query);
    setRecentSearches(getSearchHistory());
    setIsOpen(false);

    // Track search before navigation
    await trackSearch(query, resultCount || 0);

    onSubmit(query);
  };

  const handleSuggestionClick = async (suggestion: SearchSuggestion) => {
    saveSearchHistory(suggestion.name);
    setRecentSearches(getSearchHistory());
    setIsOpen(false);

    // Track search before navigation
    await trackSearch(suggestion.name, 1);

    router.push(`/search?q=${encodeURIComponent(suggestion.name)}`);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setRecentSearches([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) {
        handleSelect(value.trim());
      }
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  const hasResults =
    suggestions.length > 0 ||
    recentSearches.length > 0 ||
    trendingSearches.length > 0;

  // Memoize empty state message
  const emptyStateMessage = useMemo(() => {
    if (value.trim().length < 2) {
      return "Type at least 2 characters to search";
    }
    if (error) {
      return error;
    }
    return "No products found. Try a different search term.";
  }, [value, error]);

  return (
    <div className={`relative ${className}`}>
      <Popover
        open={isOpen && (hasResults || isLoading || value.trim().length > 0)}
        onOpenChange={setIsOpen}
      >
        <PopoverTrigger asChild>
          <div className="relative flex items-center">
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="search"
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              onFocus={() => {
                if (value.trim().length >= 2 || recentSearches.length > 0) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              className={`${sizeClasses[size]} ${inputClassName} ${
                showSearchButton ? "pr-10" : ""
              }`}
              aria-label="Search products"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            />
            {showSearchButton && (
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center ${
                  size === "sm"
                    ? "h-6 w-6"
                    : size === "md"
                    ? "h-8 w-8"
                    : "h-10 w-10"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  if (value.trim()) {
                    handleSelect(value.trim());
                  }
                }}
                disabled={!value.trim()}
                aria-label="Search"
              >
                <Search
                  className={`${
                    size === "sm"
                      ? "h-3 w-3"
                      : size === "md"
                      ? "h-4 w-4"
                      : "h-5 w-5"
                  }`}
                />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Command shouldFilter={false}>
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : error ? (
                <div className="py-6 px-4 text-center">
                  <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">{error}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please try again or check your connection.
                  </p>
                </div>
              ) : suggestions.length > 0 ? (
                <CommandGroup heading="Products">
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      value={suggestion.name}
                      onSelect={() => handleSuggestionClick(suggestion)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-3 w-full">
                        {suggestion.image && (
                          <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={suggestion.image}
                              alt={suggestion.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {suggestion.name}
                          </p>
                          {suggestion.brand && (
                            <p className="text-xs text-muted-foreground truncate">
                              {suggestion.brand}
                            </p>
                          )}
                          {suggestion.category && (
                            <p className="text-xs text-muted-foreground truncate">
                              {suggestion.category.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : value.trim().length >= 2 ? (
                <CommandEmpty>
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {emptyStateMessage}
                    </p>
                    {trendingSearches.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          Try these popular searches:
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {trendingSearches.slice(0, 3).map((trend) => (
                            <Button
                              key={trend.query}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleSelect(trend.query)}
                            >
                              {trend.query}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CommandEmpty>
              ) : null}

              {value.trim().length < 2 && (
                <>
                  {recentSearches.length > 0 && (
                    <CommandGroup heading="Recent Searches">
                      {recentSearches.map((search, index) => (
                        <CommandItem
                          key={index}
                          value={search}
                          onSelect={() => handleSelect(search)}
                          className="cursor-pointer"
                        >
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{search}</span>
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={handleClearHistory}
                        className="cursor-pointer text-muted-foreground"
                      >
                        <X className="mr-2 h-4 w-4" />
                        <span>Clear history</span>
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {trendingSearches.length > 0 && (
                    <CommandGroup heading="Trending Searches">
                      {trendingSearches.map((trend, index) => (
                        <CommandItem
                          key={index}
                          value={trend.query}
                          onSelect={() => handleSelect(trend.query)}
                          className="cursor-pointer"
                        >
                          <TrendingUp className="mr-2 h-4 w-4 text-gold" />
                          <span className="flex-1">{trend.query}</span>
                          <span className="text-xs text-muted-foreground">
                            {trend.count} searches
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
