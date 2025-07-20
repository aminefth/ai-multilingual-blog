import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

class SearchService {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/v1/search`,
      timeout: 10000,
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Search API Error:', error);
        throw error;
      },
    );
  }

  /**
   * Search blog posts
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchPosts(query, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        language = null,
        category = null,
        tags = null,
        sort = 'publishedAt:desc',
        isPremium = null,
      } = options;

      const params = {
        q: query,
        limit,
        offset,
        sort,
      };

      if (language) params.language = language;
      if (category) params.category = category;
      if (tags) params.tags = Array.isArray(tags) ? tags.join(',') : tags;
      if (isPremium !== null) params.isPremium = isPremium;

      const response = await this.client.get('/', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(`Search failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get search suggestions
   * @param {string} query - Search query
   * @param {Object} options - Options
   * @returns {Promise<Array>} Suggestions
   */
  async getSuggestions(query, options = {}) {
    try {
      const { limit = 5, language = null } = options;

      const params = { q: query, limit };
      if (language) params.language = language;

      const response = await this.client.get('/suggestions', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(
        `Failed to get suggestions: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Search categories
   * @param {string} query - Search query
   * @param {Object} options - Options
   * @returns {Promise<Object>} Category search results
   */
  async searchCategories(query, options = {}) {
    try {
      const { limit = 10, language = null } = options;

      const params = { q: query, limit };
      if (language) params.language = language;

      const response = await this.client.get('/categories', { params });
      return response.data.data;
    } catch (error) {
      throw new Error(`Category search failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get search statistics (admin only)
   * @returns {Promise<Object>} Search stats
   */
  async getStats() {
    try {
      const response = await this.client.get('/stats');
      return response.data.data;
    } catch (error) {
      throw new Error(
        `Failed to get search stats: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * Reindex search data (admin only)
   * @param {string} type - Type to reindex ('posts', 'categories', 'all')
   * @returns {Promise<Object>} Reindex results
   */
  async reindex(type = 'all') {
    try {
      const response = await this.client.post('/reindex', { type });
      return response.data.data;
    } catch (error) {
      throw new Error(`Reindexing failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Debounced search function
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} delay - Debounce delay in ms
   * @returns {Promise<Object>} Search results
   */
  async debouncedSearch(query, options = {}, delay = 300) {
    return new Promise((resolve, reject) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        try {
          const results = await this.searchPosts(query, options);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Search with autocomplete
   * @param {string} query - Search query
   * @param {Object} options - Options
   * @returns {Promise<Object>} Combined search and suggestions
   */
  async searchWithAutocomplete(query, options = {}) {
    try {
      const [searchResults, suggestions] = await Promise.all([
        this.searchPosts(query, { ...options, limit: options.limit || 10 }),
        this.getSuggestions(query, { limit: 5, language: options.language }),
      ]);

      return {
        results: searchResults,
        suggestions,
        query,
      };
    } catch (error) {
      throw new Error(`Search with autocomplete failed: ${error.message}`);
    }
  }

  /**
   * Global search across all content types
   * @param {string} query - Search query
   * @param {Object} options - Options
   * @returns {Promise<Object>} Combined search results
   */
  async globalSearch(query, options = {}) {
    try {
      const [posts, categories] = await Promise.all([
        this.searchPosts(query, { ...options, limit: options.postsLimit || 10 }),
        this.searchCategories(query, {
          limit: options.categoriesLimit || 5,
          language: options.language,
        }),
      ]);

      return {
        posts: posts.hits || [],
        categories: categories.hits || [],
        totalPosts: posts.totalHits || 0,
        totalCategories: categories.totalHits || 0,
        query,
        processingTimeMs: Math.max(posts.processingTimeMs || 0, categories.processingTimeMs || 0),
      };
    } catch (error) {
      throw new Error(`Global search failed: ${error.message}`);
    }
  }

  /**
   * Get popular searches (mock implementation - would need backend support)
   * @param {Object} options - Options
   * @returns {Promise<Array>} Popular searches
   */
  async getPopularSearches(options = {}) {
    // This would typically come from analytics/backend
    // For now, return mock data based on language
    const { language = 'en', limit = 10 } = options;

    const popularSearches = {
      en: [
        'AI tools',
        'ChatGPT',
        'Machine Learning',
        'Web Development',
        'React',
        'Next.js',
        'JavaScript',
        'Python',
        'SEO',
        'Digital Marketing',
      ],
      fr: [
        'Outils IA',
        'ChatGPT',
        'Apprentissage automatique',
        'Développement web',
        'React',
        'Next.js',
        'JavaScript',
        'Python',
        'SEO',
        'Marketing numérique',
      ],
      es: [
        'Herramientas IA',
        'ChatGPT',
        'Aprendizaje automático',
        'Desarrollo web',
        'React',
        'Next.js',
        'JavaScript',
        'Python',
        'SEO',
        'Marketing digital',
      ],
      de: [
        'KI-Tools',
        'ChatGPT',
        'Maschinelles Lernen',
        'Webentwicklung',
        'React',
        'Next.js',
        'JavaScript',
        'Python',
        'SEO',
        'Digitales Marketing',
      ],
      ar: [
        'أدوات الذكاء الاصطناعي',
        'ChatGPT',
        'تعلم الآلة',
        'تطوير الويب',
        'React',
        'Next.js',
        'JavaScript',
        'Python',
        'SEO',
        'التسويق الرقمي',
      ],
    };

    return (popularSearches[language] || popularSearches.en).slice(0, limit);
  }

  /**
   * Clear search cache/timeout
   */
  clearCache() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;

// Named exports for specific functions
export const {
  searchPosts,
  getSuggestions,
  searchCategories,
  getStats,
  reindex,
  debouncedSearch,
  searchWithAutocomplete,
  globalSearch,
  getPopularSearches,
  clearCache,
} = searchService;
