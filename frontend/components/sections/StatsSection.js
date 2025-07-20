'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import {
  UsersIcon,
  StarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  TrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export function StatsSection() {
  const { t } = useI18n();
  const [counters, setCounters] = useState({
    users: 0,
    tools: 0,
    articles: 0,
    countries: 0,
    rating: 0,
    uptime: 0,
  });

  const stats = [
    {
      id: 'users',
      label: 'Active Users',
      value: 50000,
      suffix: '+',
      icon: UsersIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      id: 'tools',
      label: 'AI Tools Reviewed',
      value: 500,
      suffix: '+',
      icon: StarIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      id: 'articles',
      label: 'Expert Articles',
      value: 1200,
      suffix: '+',
      icon: DocumentTextIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      id: 'countries',
      label: 'Countries Served',
      value: 150,
      suffix: '+',
      icon: GlobeAltIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      id: 'rating',
      label: 'Average Rating',
      value: 4.9,
      suffix: '/5',
      icon: TrendingUpIcon,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      decimals: 1,
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: 99.9,
      suffix: '%',
      icon: ClockIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      decimals: 1,
    },
  ];

  // Animate counters on component mount
  useEffect(() => {
    const animateCounters = () => {
      stats.forEach((stat) => {
        let start = 0;
        const end = stat.value;
        const duration = 2000; // 2 seconds
        const increment = end / (duration / 16); // 60fps

        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            start = end;
            clearInterval(timer);
          }

          setCounters((prev) => ({
            ...prev,
            [stat.id]: stat.decimals ? parseFloat(start.toFixed(stat.decimals)) : Math.floor(start),
          }));
        }, 16);
      });
    };

    // Start animation after a short delay
    const timeout = setTimeout(animateCounters, 500);
    return () => clearTimeout(timeout);
  }, []);

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
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Join our growing community of AI enthusiasts, professionals, and businesses who rely
              on our expert insights and recommendations.
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 100,
                }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group-hover:border-primary-300 dark:group-hover:border-primary-600">
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>

                  {/* Counter */}
                  <div className="mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      {counters[stat.id].toLocaleString()}
                    </span>
                    <span className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                      {stat.suffix}
                    </span>
                  </div>

                  {/* Label */}
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Daily Updates</h3>
              <p className="text-primary-100">Fresh content and tool reviews added every day</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Expert Verified</h3>
              <p className="text-green-100">All reviews tested by AI professionals</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Community Driven</h3>
              <p className="text-purple-100">Real feedback from active users worldwide</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
