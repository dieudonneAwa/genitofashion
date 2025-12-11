// Search history utilities
const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

export function saveSearchHistory(query: string): void {
  if (typeof window === 'undefined') return;
  
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return;
  
  try {
    const history = getSearchHistory();
    // Remove duplicate and add to beginning
    const updated = [trimmedQuery, ...history.filter(q => q.toLowerCase() !== trimmedQuery.toLowerCase())].slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading search history:', error);
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}


