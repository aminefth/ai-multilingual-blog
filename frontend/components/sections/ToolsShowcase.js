'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '../../contexts/I18nContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import {
  StarIcon,
  ChevronRightIcon,
  SparklesIcon,
  BoltIcon,
  CpuChipIcon,
  PaintBrushIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function ToolsShowcase() {
  const { t } = useI18n();
  const { trackClick } = useAnalytics();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: t('All Tools'), icon: SparklesIcon },
    { id: 'writing', name: t('Writing'), icon: PencilIcon },
    { id: 'image', name: t('Image Gen'), icon: PaintBrushIcon },
    { id: 'coding', name: t('Coding'), icon: CpuChipIcon },
    { id: 'chat', name: t('Chat AI'), icon: ChatBubbleLeftRightIcon },
    { id: 'productivity', name: t('Productivity'), icon: BoltIcon },
    { id: 'writing', name: 'Writing', icon: PencilIcon },
    { id: 'image', name: 'Image Gen', icon: PaintBrushIcon },
    { id: 'coding', name: 'Coding', icon: CpuChipIcon },
    { id: 'chat', name: 'Chat AI', icon: ChatBubbleLeftRightIcon },
    { id: 'productivity', name: 'Productivity', icon: BoltIcon },
  ];

  const featuredTools = [
    {
      id: 1,
      name: 'ChatGPT',
      category: 'chat',
      description: 'Advanced conversational AI for writing, coding, and problem-solving',
      rating: 4.8,
      reviews: 12500,
      price: 'Free + $20/mo',
      image: '/images/tools/chatgpt.png',
      badge: 'Most Popular',
      features: ['Text Generation', 'Code Writing', 'Analysis', 'Creative Writing'],
      affiliateUrl: '/tools/chatgpt',
    },
    {
      id: 2,
      name: 'Midjourney',
      category: 'image',
      description: 'Create stunning AI-generated artwork and images from text prompts',
      rating: 4.9,
      reviews: 8900,
      price: '$10-60/mo',
      image: '/images/tools/midjourney.png',
      badge: "Editor's Choice",
      features: ['Image Generation', 'Art Creation', 'Style Transfer', 'High Quality'],
      affiliateUrl: '/tools/midjourney',
    },
    {
      id: 3,
      name: 'GitHub Copilot',
      category: 'coding',
      description: 'AI pair programmer that helps you write code faster and smarter',
      rating: 4.6,
      reviews: 15600,
      price: '$10/mo',
      image: '/images/tools/copilot.png',
      badge: 'Developer Favorite',
      features: ['Code Completion', 'Bug Fixes', 'Documentation', 'Multi-Language'],
      affiliateUrl: '/tools/github-copilot',
    },
    {
      id: 4,
      name: 'Jasper AI',
      category: 'writing',
      description: 'Professional AI writing assistant for marketing and content creation',
      rating: 4.7,
      reviews: 6800,
      price: '$39-125/mo',
      image: '/images/tools/jasper.png',
      badge: 'Business Choice',
      features: ['Content Writing', 'SEO Optimization', 'Templates', 'Team Collaboration'],
      affiliateUrl: '/tools/jasper-ai',
    },
    {
      id: 5,
      name: 'Notion AI',
      category: 'productivity',
      description: 'Intelligent workspace that combines notes, tasks, and AI assistance',
      rating: 4.5,
      reviews: 9200,
      price: 'Free + $8/mo',
      image: '/images/tools/notion.png',
      badge: 'Rising Star',
      features: ['Note Taking', 'Task Management', 'AI Writing', 'Database'],
      affiliateUrl: '/tools/notion-ai',
    },
    {
      id: 6,
      name: 'Claude',
      category: 'chat',
      description: "Anthropic's AI assistant focused on helpful, harmless, and honest interactions",
      rating: 4.7,
      reviews: 4300,
      price: 'Free + $20/mo',
      image: '/images/tools/claude.png',
      badge: 'New',
      features: ['Long Conversations', 'Document Analysis', 'Coding Help', 'Research'],
      affiliateUrl: '/tools/claude',
    },
  ];

  const filteredTools =
    activeCategory === 'all'
      ? featuredTools
      : featuredTools.filter((tool) => tool.category === activeCategory);

  const handleToolClick = (tool) => {
    trackClick('tool_showcase_click', 'Tools Showcase', { toolName: tool.name });
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    trackClick('tool_category_filter', 'Tools Showcase', { category: categoryId });
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
        ))}
        {hasHalfStar && <StarIcon className="h-4 w-4 text-yellow-400" />}
        {[...Array(5 - Math.ceil(rating))].map((_, i) => (
          <StarIcon key={i} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        ))}
      </div>
    );
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
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
              Featured AI Tools
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover the most powerful AI tools, carefully tested and reviewed by our experts.
              Find the perfect solution for your needs.
            </p>
          </motion.div>
        </div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <Link href={tool.affiliateUrl} onClick={() => handleToolClick(tool)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:border-primary-300 dark:group-hover:border-primary-600">
                  {/* Tool Image & Badge */}
                  <div className="relative p-6 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                      <span className="text-white font-bold text-xl">{tool.name.charAt(0)}</span>
                    </div>

                    {tool.badge && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                          {tool.badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tool Info */}
                  <div className="px-6 pb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {tool.name}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                      {tool.description}
                    </p>

                    {/* Rating & Reviews */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {renderStars(tool.rating)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tool.reviews.toLocaleString()} reviews
                      </span>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tool.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {tool.features.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          +{tool.features.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {tool.price}
                      </div>
                      <div className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                        <span className="text-sm font-medium">Learn More</span>
                        <ChevronRightIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Tools CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/tools"
            className="btn btn-outline btn-lg inline-flex items-center space-x-2"
            onClick={() => trackClick('view_all_tools', 'Tools Showcase')}
          >
            <span>View All 500+ Tools</span>
            <ChevronRightIcon className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
