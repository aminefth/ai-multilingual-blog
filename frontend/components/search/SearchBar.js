'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SearchAPI } from '@/lib/api';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useToast } from '@/contexts/ToastContext';

export default function SearchBar({
  className = '',
  placeholder = 'Search articles, tools, categories...',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await SearchAPI.search(query, {
          limit: 8,
          types: ['posts', 'categories', 'tools'],
        });
        setResults(searchResults.results || []);
        setIsOpen(true);
        setSelectedIndex(-1);

        // Track search event
        trackEvent('search_query', {
          query,
          results_count: searchResults.results?.length || 0,
        });
      } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.', 'error');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, trackEvent, showToast]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleResultClick(results[selectedIndex]);
          } else if (query.trim()) {
            handleSearch();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          searchRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result) => {
    const url = getResultUrl(result);
    if (url) {
      trackEvent('search_result_click', {
        query,
        result_type: result.type,
        result_id: result.id,
        result_title: result.title,
      });
      router.push(url);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      trackEvent('search_submit', { query });
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const getResultUrl = (result) => {
    switch (result.type) {
      case 'post':
        return `/blog/${result.slug}`;
      case 'category':
        return `/blog/category/${result.slug}`;
      case 'tool':
        return `/tools/${result.slug}`;
      default:
        return null;
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'post':
        return '📄';
      case 'category':
        return '📁';
      case 'tool':
        return '🔧';
      default:
        return '🔍';
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    searchRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          autoComplete="off"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}

        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                } ${index === 0 ? 'rounded-t-lg' : ''} ${
                  index === results.length - 1
                    ? 'rounded-b-lg'
                    : 'border-b border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getResultIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    {result.excerpt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.excerpt}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {result.type}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {query.trim() && (
              <button
                onClick={handleSearch}
                className="w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
              >
                <div className="flex items-center space-x-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Search for "{query}"
                  </span>
                </div>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
