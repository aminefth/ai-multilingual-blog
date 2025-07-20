'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import { BlogAPI } from '@/lib/api';
import {
  PencilIcon,
  PhotoIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  MusicNoteIcon,
  VideoCameraIcon,
  ChartBarIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ShoppingBagIcon,
  HeartIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { SkeletonGrid } from '@/components/ui/SkeletonCard';

export function CategoriesGrid() {
  const { t } = useI18n();
  const { trackClick } = useAnalytics();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Icon mapping for categories
  const categoryIcons = {
    writing: PencilIcon,
    image: PhotoIcon,
    coding: CpuChipIcon,
    chat: ChatBubbleLeftRightIcon,
    productivity: BoltIcon,
    audio: MusicNoteIcon,
    video: VideoCameraIcon,
    analytics: ChartBarIcon,
    translation: GlobeAltIcon,
    education: AcademicCapIcon,
    ecommerce: ShoppingBagIcon,
    health: HeartIcon,
  };

  // Default categories with mock data if API fails
  const defaultCategories = [
    {
      id: 1,
      name: 'Writing & Content',
      slug: 'writing',
      description: 'AI tools for content creation, copywriting, and text generation',
      toolCount: 85,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 2,
      name: 'Image Generation',
      slug: 'image',
      description: 'Create stunning visuals, artwork, and graphics with AI',
      toolCount: 67,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 3,
      name: 'Code & Development',
      slug: 'coding',
      description: 'AI-powered coding assistants and development tools',
      toolCount: 52,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 4,
      name: 'Chat & Assistants',
      slug: 'chat',
      description: 'Conversational AI and virtual assistant platforms',
      toolCount: 43,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 5,
      name: 'Productivity',
      slug: 'productivity',
      description: 'Boost efficiency with AI-powered productivity tools',
      toolCount: 78,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 6,
      name: 'Audio & Music',
      slug: 'audio',
      description: 'AI tools for audio generation, music, and voice synthesis',
      toolCount: 34,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      textColor: 'text-pink-600 dark:text-pink-400',
    },
    {
      id: 7,
      name: 'Video & Animation',
      slug: 'video',
      description: 'Create and edit videos with AI-powered tools',
      toolCount: 29,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      id: 8,
      name: 'Analytics & Data',
      slug: 'analytics',
      description: 'AI-driven analytics and data visualization tools',
      toolCount: 41,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      textColor: 'text-teal-600 dark:text-teal-400',
    },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await BlogAPI.getCategories();
      setCategories(response.results || defaultCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Use default categories as fallback
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    trackClick('category_click', 'Categories Grid', {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  if (loading) {
    return (
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container-custom">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto"></div>
          </div>
          <SkeletonGrid variant="category" count={8} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              Explore AI Tool Categories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Browse our comprehensive collection of AI tools organized by category. Find the
              perfect solution for your specific needs and use cases.
            </p>
          </motion.div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category.slug] || CpuChipIcon;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 100,
                }}
                viewport={{ once: true }}
                className="group"
              >
                <Link
                  href={`/tools/category/${category.slug}`}
                  onClick={() => handleCategoryClick(category)}
                  className="block"
                >
                  <div
                    className={`relative p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group-hover:border-primary-300 dark:group-hover:border-primary-600 overflow-hidden ${category.bgColor || 'bg-gray-50 dark:bg-gray-900'}`}
                  >
                    {/* Background Gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color || 'from-gray-400 to-gray-600'} opacity-5 group-hover:opacity-10 transition-opacity`}
                    ></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${category.bgColor || 'bg-gray-100 dark:bg-gray-800'} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent
                          className={`h-6 w-6 ${category.textColor || 'text-gray-600 dark:text-gray-400'}`}
                        />
                      </div>

                      {/* Category Name */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {category.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {category.description}
                      </p>

                      {/* Tool Count & Arrow */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${category.textColor || 'text-gray-600 dark:text-gray-400'}`}
                        >
                          {category.toolCount || 0} tools
                        </span>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-accent-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Popular Categories Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Can't find what you're looking for?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            We're constantly adding new AI tools and categories. Submit a request or browse our
            complete directory to discover more solutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/tools"
              className="btn btn-primary"
              onClick={() => trackClick('browse_all_tools', 'Categories Grid')}
            >
              Browse All Tools
            </Link>
            <Link
              href="/submit-tool"
              className="btn btn-outline"
              onClick={() => trackClick('submit_tool_request', 'Categories Grid')}
            >
              Submit a Tool
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
