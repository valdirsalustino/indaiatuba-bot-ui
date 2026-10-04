import { useState, useEffect } from 'react';

export default function useUserSearch(apiBaseUrl, authFetch, debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    if (!query || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      authFetch(`${apiBaseUrl}/conversations/users?search=${encodeURIComponent(query)}`)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          if (!ignore) {
            setResults(data);
            setIsLoading(false);
          }
        })
        .catch(err => {
          if (!ignore) {
            console.error('Failed to search users:', err);
            setError(err);
            setIsLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, apiBaseUrl, debounceMs, authFetch]);

  return { query, setQuery, results, isLoading, error, setResults };
}
