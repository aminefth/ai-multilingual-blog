'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useKBar } from 'kbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  TrendingUpIcon,
  DocumentTextIcon,
  TagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useI18n } from '../../contexts/I18nContext';
import searchService from '../../lib/search';
import { useAuth } from '../providers/AuthProvider';
import toast from 'react-hot-toast';

const EnhancedSearch = ({ 
  placeholder,
  showPopular = true,
  showRecent = true,
  autoFocus = false,
  onResultClick,
  className = '',
}) => {
  const router = useRouter();
  const { query, toggle } = useKBar();
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchInputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load popular and recent searches on mount
  useEffect(() => {
    loadPopularSearches();
    loadRecentSearches();
  }, [locale]);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  const loadPopularSearches = async () => {
    try {
      const popular = await searchService.getPopularSearches({ language: locale, limit: 8 });
      setPopularSearches(popular);
    } catch (error) {
      console.error('Failed to load popular searches:', error);
    }
  };

  const loadRecentSearches = () => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecentSearches(recent.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const saveToRecentSearches = (query) => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      setRecentSearches(updated.slice(0, 5));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };

  const performSearch = useCallback(async (query, options = {}) => {
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const searchResults = await searchService.searchWithAutocomplete(query, {
        language: locale,
        limit: 8,
        ...options,
      });

      setResults(searchResults.results.hits || []);
      setSuggestions(searchResults.suggestions || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error(t('search.error'));
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      debouncedSearch(value);
      setIsOpen(true);
    } else {
      setResults([]);
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicks on results
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleKeyDown = (e) => {
    const totalItems = results.length + suggestions.length + popularSearches.length + recentSearches.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleItemSelect(getItemAtIndex(selectedIndex));
        } else if (searchQuery.trim()) {
          handleSearch(searchQuery);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        searchInputRef.current?.blur();
        break;
      case '/':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggle();
        }
        break;
    }
  };

  const getItemAtIndex = (index) => {
    let currentIndex = 0;
    
    // Results
    if (index < results.length) {
      return { type: 'result', data: results[index] };
    }
    currentIndex += results.length;
    
    // Suggestions
    if (index < currentIndex + suggestions.length) {
      return { type: 'suggestion', data: suggestions[index - currentIndex] };
    }
    currentIndex += suggestions.length;
    
    // Recent searches
    if (index < currentIndex + recentSearches.length) {
      return { type: 'recent', data: recentSearches[index - currentIndex] };
    }
    currentIndex += recentSearches.length;
    
    // Popular searches
    if (index < currentIndex + popularSearches.length) {
      return { type: 'popular', data: popularSearches[index - currentIndex] };
    }
    
    return null;
  };

  const handleItemSelect = (item) => {
    if (!item) return;
    
    switch (item.type) {
      case 'result':
        handleResultClick(item.data);
        break;
      case 'suggestion':
        handleSuggestionClick(item.data);
        break;
      case 'recent':
      case 'popular':
        handleSearch(item.data);
        break;
    }
  };

  const handleResultClick = (result) => {
    const url = `/blog/${result.slug}`;
    saveToRecentSearches(searchQuery);
    
    if (onResultClick) {
      onResultClick(result, url);
    } else {
      router.push(url);
    }
    
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    performSearch(suggestion.title);
  };

  const handleSearch = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    saveToRecentSearches(trimmedQuery);
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSuggestions([]);
    setIsOpen(false);
    searchInputRef.current?.focus();
  };

  const renderResultItem = (item, index, type) => {
    const isSelected = selectedIndex === index;
    
    return (
      <motion.div
        key={`${type}-${index}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`px-4 py-3 cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-accent text-accent-foreground' 
            : 'hover:bg-muted'
        }`}
        onClick={() => handleItemSelect({ type, data: item })}
      >
        <div className="flex items-center gap-3">
          {type === 'result' && <DocumentTextIcon className="w-4 h-4 text-muted-foreground" />}
          {type === 'suggestion' && <SparklesIcon className="w-4 h-4 text-muted-foreground" />}
          {type === 'recent' && <ClockIcon className="w-4 h-4 text-muted-foreground" />}
          {type === 'popular' && <TrendingUpIcon className="w-4 h-4 text-muted-foreground" />}
          
          <div className="flex-1 min-w-0">
            {type === 'result' ? (
              <>
                <div className="font-medium truncate" dangerouslySetInnerHTML={{ __html: item.title }} />
                {item.excerpt && (
                  <div className="text-sm text-muted-foreground truncate mt-1" 
                       dangerouslySetInnerHTML={{ __html: item.excerpt }} />
                )}
                {item.category && (
                  <div className="flex items-center gap-1 mt-1">
                    <TagIcon className="w-3 h-3" />
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="truncate">{typeof item === 'string' ? item : item.title}</div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('search.placeholder')}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {/* Search Results */}
            {results.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  {t('search.results')}
                </div>
                {results.map((result, index) => renderResultItem(result, index, 'result'))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  {t('search.suggestions')}
                </div>
                {suggestions.map((suggestion, index) => 
                  renderResultItem(suggestion, results.length + index, 'suggestion')
                )}
              </div>
            )}

            {/* Recent Searches */}
            {!searchQuery && showRecent && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  {t('search.recent')}
                </div>
                {recentSearches.map((search, index) => 
                  renderResultItem(search, results.length + suggestions.length + index, 'recent')
                )}
              </div>
            )}

            {/* Popular Searches */}
            {!searchQuery && showPopular && popularSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                  {t('search.popular')}
                </div>
                {popularSearches.map((search, index) => 
                  renderResultItem(search, results.length + suggestions.length + recentSearches.length + index, 'popular')
                )}
              </div>
            )}

            {/* No Results */}
            {searchQuery && !isLoading && results.length === 0 && suggestions.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('search.noResults')}</p>
                <p className="text-sm mt-1">{t('search.tryDifferent')}</p>
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && !isLoading && recentSearches.length === 0 && popularSearches.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('search.startTyping')}</p>
                <p className="text-sm mt-1">
                  {t('search.shortcut')} <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearch;
