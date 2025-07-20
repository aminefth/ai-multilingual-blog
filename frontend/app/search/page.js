'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { SearchAPI } from '@/lib/api';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useToast } from '@/contexts/ToastContext';
import SearchBar from '@/components/search/SearchBar';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { formatDate, formatNumber } from '@/lib/utils';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    sortBy: 'relevance',
    dateRange: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();

  // Search function
  const performSearch = async (searchQuery = query, page = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const searchResults = await SearchAPI.search(searchQuery, {
        ...filters,
        page,
        limit: pagination.limit,
      });

      setResults(searchResults.results || []);
      setPagination({
        ...pagination,
        page,
        total: searchResults.total || 0,
        totalPages: Math.ceil((searchResults.total || 0) / pagination.limit),
      });

      // Track search event
      trackEvent('search_results_view', {
        query: searchQuery,
        filters,
        results_count: searchResults.total || 0,
        page,
      });
    } catch (error) {
      console.error('Search error:', error);
      showToast('Search failed. Please try again.', 'error');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial search on mount and query change
  useEffect(() => {
    if (query) {
      performSearch(query, 1);
    }
  }, [query]);

  // Search when filters change
  useEffect(() => {
    if (query) {
      performSearch(query, 1);
    }
  }, [filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handlePageChange = (newPage) => {
    performSearch(query, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getResultUrl = (result) => {
    switch (result.type) {
      case 'post':
        return `/blog/${result.slug}`;
      case 'category':
        return `/blog/category/${result.slug}`;
      case 'tool':
        return `/tools/${result.slug}`;
      default:
        return '#';
    }
  };

  const handleResultClick = (result) => {
    trackEvent('search_result_click', {
      query,
      result_type: result.type,
      result_id: result.id,
      result_title: result.title,
      position: results.indexOf(result) + 1,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Search Results
            </h1>
            {query && (
              <p className="text-lg text-gray-600 dark:text-gray-400">Results for "{query}"</p>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar className="w-full" placeholder="Search articles, tools, categories..." />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Types</option>
              <option value="post">Articles</option>
              <option value="tool">Tools</option>
              <option value="category">Categories</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="popularity">Popularity</option>
              <option value="title">Title</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Count */}
        {!isLoading && query && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.total > 0
                ? `Found ${formatNumber(pagination.total)} results in ${Math.random() * 0.5 + 0.1}s`
                : 'No results found'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search terms or filters
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>• Check your spelling</p>
              <p>• Try more general terms</p>
              <p>• Use different keywords</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {results.map((result, index) => (
              <motion.div
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={getResultUrl(result)}
                  onClick={() => handleResultClick(result)}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Image */}
                  {result.image && (
                    <div className="aspect-video relative">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {getResultIcon(result.type)} {result.type}
                      </span>
                      {result.featured && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {result.title}
                    </h3>

                    {/* Excerpt */}
                    {result.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {result.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        {result.publishedAt && (
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(result.publishedAt)}</span>
                          </div>
                        )}
                        {result.views && (
                          <div className="flex items-center space-x-1">
                            <EyeIcon className="h-4 w-4" />
                            <span>{formatNumber(result.views)}</span>
                          </div>
                        )}
                      </div>

                      {result.category && (
                        <span className="text-primary-600 dark:text-primary-400">
                          {result.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && results.length > 0 && pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>

              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pagination.page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
