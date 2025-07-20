'use client';

import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import { useI18n } from '@/components/providers/I18nProvider';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon as SparklesSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function NewsletterSection() {
  const { t } = useI18n();
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const benefits = [
    {
      icon: SparklesSolidIcon,
      title: 'Weekly AI Tool Reviews',
      description: 'Get the latest AI tools tested and reviewed by our experts',
    },
    {
      icon: CheckCircleIcon,
      title: 'Exclusive Tutorials',
      description: 'Access premium guides and tutorials before anyone else',
    },
    {
      icon: ArrowRightIcon,
      title: 'Industry Insights',
      description: 'Stay ahead with AI trends and market analysis',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // Track newsletter signup attempt
      trackEvent('newsletter_signup_attempt', {
        email: email,
        source: 'homepage_newsletter_section',
      });

      // Simulate API call (replace with actual newsletter API)
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'homepage_newsletter_section',
          tags: ['homepage', 'general'],
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Welcome aboard! Check your email to confirm your subscription.');
        setEmail('');

        // Track successful signup
        trackEvent('newsletter_signup_success', {
          email: email,
          source: 'homepage_newsletter_section',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again.');

      // Track signup error
      trackEvent('newsletter_signup_error', {
        email: email,
        error: error.message,
        source: 'homepage_newsletter_section',
      });
    }
  };

  const resetStatus = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl"></div>

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <EnvelopeIcon className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              Stay Ahead of the AI Revolution
            </h2>

            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Join 50,000+ AI enthusiasts who get exclusive insights, tool reviews, and tutorials
              delivered to their inbox every week.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-primary-100 text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Newsletter Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto"
          >
            {status === 'success' ? (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
                <p className="text-primary-100 mb-4">{message}</p>
                <button
                  onClick={resetStatus}
                  className="text-white hover:text-primary-200 transition-colors text-sm underline"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                    disabled={status === 'loading'}
                    required
                  />
                  <EnvelopeIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="w-full bg-white text-primary-600 font-semibold py-4 px-8 rounded-xl hover:bg-primary-50 focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {status === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Free AI Insights</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </button>

                {status === 'error' && (
                  <div className="flex items-center space-x-2 text-red-200 text-sm">
                    <XCircleIcon className="h-5 w-5" />
                    <span>{message}</span>
                  </div>
                )}

                <p className="text-primary-100 text-xs text-center">
                  No spam, ever. Unsubscribe with one click.
                </p>
              </form>
            )}
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-primary-100"
          >
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-white/20 rounded-full border-2 border-white/30 flex items-center justify-center text-xs font-medium"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span className="text-sm">50,000+ subscribers</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <SparklesSolidIcon key={i} className="h-4 w-4 text-yellow-300" />
                ))}
              </div>
              <span className="text-sm">4.9/5 rating</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Weekly updates</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
