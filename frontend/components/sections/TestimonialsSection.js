'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import {
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuoteIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export function TestimonialsSection() {
  const { t } = useI18n();
  const { trackClick } = useAnalytics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Content Marketing Manager',
      company: 'TechFlow Inc.',
      avatar: '/images/testimonials/sarah-chen.jpg',
      rating: 5,
      content:
        'AI Tools Hub has completely transformed how I discover and evaluate AI tools for our marketing team. The detailed reviews and comparisons save me hours of research every week.',
      tools: ['Jasper AI', 'Copy.ai', 'Midjourney'],
      featured: true,
    },
    {
      id: 2,
      name: 'Marcus Rodriguez',
      role: 'Senior Developer',
      company: 'StartupLab',
      avatar: '/images/testimonials/marcus-rodriguez.jpg',
      rating: 5,
      content:
        'As a developer, I rely on AI Tools Hub to stay updated with the latest coding assistants and development tools. Their technical reviews are spot-on and incredibly helpful.',
      tools: ['GitHub Copilot', 'Tabnine', 'Replit'],
      featured: true,
    },
    {
      id: 3,
      name: 'Emily Watson',
      role: 'Freelance Designer',
      company: 'Independent',
      avatar: '/images/testimonials/emily-watson.jpg',
      rating: 5,
      content:
        "The AI image generation tool reviews helped me choose the perfect tools for my design workflow. I've increased my productivity by 300% thanks to their recommendations.",
      tools: ['Midjourney', 'DALL-E', 'Stable Diffusion'],
      featured: true,
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Business Analyst',
      company: 'DataCorp',
      avatar: '/images/testimonials/david-kim.jpg',
      rating: 5,
      content:
        'The analytics and insights from AI Tools Hub are invaluable. They helped me implement AI solutions that improved our business processes by 40%.',
      tools: ['ChatGPT', 'Claude', 'Notion AI'],
      featured: false,
    },
    {
      id: 5,
      name: 'Lisa Thompson',
      role: 'Marketing Director',
      company: 'GrowthCo',
      avatar: '/images/testimonials/lisa-thompson.jpg',
      rating: 5,
      content:
        'I love how comprehensive and unbiased the reviews are. AI Tools Hub has become my go-to resource for evaluating new AI tools before making investment decisions.',
      tools: ['Jasper AI', 'Writesonic', 'Canva AI'],
      featured: false,
    },
    {
      id: 6,
      name: 'Alex Johnson',
      role: 'Product Manager',
      company: 'InnovateTech',
      avatar: '/images/testimonials/alex-johnson.jpg',
      rating: 5,
      content:
        'The detailed comparisons and real-world use cases make it easy to understand which AI tools are worth the investment. Highly recommended!',
      tools: ['Linear', 'Notion AI', 'Figma AI'],
      featured: false,
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    trackClick('testimonial_previous', 'Testimonials');
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    trackClick('testimonial_next', 'Testimonials');
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    trackClick('testimonial_dot_click', 'Testimonials', { index });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <StarSolidIcon
            key={i}
            className={`h-5 w-5 ${
              i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const currentTestimonial = testimonials[currentIndex];

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
              Trusted by Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See what AI enthusiasts, developers, marketers, and business leaders say about AI
              Tools Hub and how we've helped them succeed.
            </p>
          </motion.div>
        </div>

        {/* Main Testimonial Carousel */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 dark:border-gray-700"
              >
                {/* Quote Icon */}
                <div className="flex justify-center mb-8">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <QuoteIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center mb-6">
                  {renderStars(currentTestimonial.rating)}
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-xl md:text-2xl text-gray-900 dark:text-white text-center font-medium leading-relaxed mb-8">
                  "{currentTestimonial.content}"
                </blockquote>

                {/* Author Info */}
                <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="flex items-center space-x-4">
                    {currentTestimonial.avatar ? (
                      <Image
                        src={currentTestimonial.avatar}
                        alt={currentTestimonial.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="text-center md:text-left">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentTestimonial.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">{currentTestimonial.role}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {currentTestimonial.company}
                      </p>
                    </div>
                  </div>

                  {/* Tools Used */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentTestimonial.tools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary-600 dark:bg-primary-400'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              50K+
            </div>
            <div className="text-gray-600 dark:text-gray-400">Happy Users</div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              4.9
            </div>
            <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              500+
            </div>
            <div className="text-gray-600 dark:text-gray-400">Tools Reviewed</div>
          </div>

          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              150+
            </div>
            <div className="text-gray-600 dark:text-gray-400">Countries</div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Join Thousands of Satisfied Users
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Start discovering the best AI tools for your needs today. Join our community and see
              why professionals trust AI Tools Hub.
            </p>
            <button
              onClick={() => trackClick('testimonials_cta_join', 'Testimonials')}
              className="btn btn-primary btn-lg"
            >
              Get Started Free
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
