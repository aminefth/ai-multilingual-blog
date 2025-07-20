'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

export function FAQSection() {
  const { t } = useI18n();
  const { trackClick } = useAnalytics();
  const [openIndex, setOpenIndex] = useState(0); // First FAQ open by default

  const faqs = [
    {
      id: 1,
      question: 'What is AI Tools Hub and how does it work?',
      answer:
        'AI Tools Hub is a comprehensive platform that reviews, compares, and recommends the best AI tools for professionals and businesses. Our expert team tests hundreds of AI tools across different categories and provides detailed, unbiased reviews with real-world use cases, pricing information, and performance metrics.',
      category: 'General',
      keywords: ['platform', 'reviews', 'AI tools', 'comparison'],
    },
    {
      id: 2,
      question: 'How do you test and review AI tools?',
      answer:
        'Our review process involves hands-on testing by AI experts and industry professionals. We evaluate each tool based on functionality, ease of use, pricing, customer support, integration capabilities, and real-world performance. We also gather feedback from our community of 50,000+ users to ensure comprehensive and accurate reviews.',
      category: 'Reviews',
      keywords: ['testing', 'methodology', 'experts', 'evaluation'],
    },
    {
      id: 3,
      question: 'Are your reviews biased or sponsored?',
      answer:
        'We maintain strict editorial independence. While we may earn affiliate commissions from some tool recommendations, this never influences our reviews or ratings. All tools are evaluated using the same rigorous criteria, and we clearly disclose any affiliate relationships. Our primary goal is to help users find the best AI tools for their needs.',
      category: 'Trust',
      keywords: ['unbiased', 'independent', 'affiliate', 'transparency'],
    },
    {
      id: 4,
      question: 'How often do you update your tool reviews?',
      answer:
        'We continuously monitor the AI tools landscape and update our reviews regularly. Major updates are published monthly, with breaking news and new tool releases covered weekly. Our database includes over 500 tools with real-time pricing and feature updates.',
      category: 'Updates',
      keywords: ['updates', 'frequency', 'monitoring', 'current'],
    },
    {
      id: 5,
      question: 'Can I suggest a tool for review?',
      answer:
        'Absolutely! We welcome tool suggestions from our community. You can submit new tools through our "Submit a Tool" page. We review all submissions and prioritize tools based on user demand, innovation, and potential impact. Popular requests are typically reviewed within 2-4 weeks.',
      category: 'Community',
      keywords: ['suggest', 'submit', 'community', 'requests'],
    },
    {
      id: 6,
      question: 'Do you offer personalized AI tool recommendations?',
      answer:
        'Yes! Our premium subscribers get access to personalized recommendations based on their industry, use cases, budget, and preferences. We also offer one-on-one consultation calls for enterprise clients looking to implement AI solutions at scale.',
      category: 'Premium',
      keywords: ['personalized', 'recommendations', 'premium', 'consultation'],
    },
    {
      id: 7,
      question: 'What makes AI Tools Hub different from other review sites?',
      answer:
        'Unlike generic review sites, we specialize exclusively in AI tools with deep technical expertise. Our team includes AI researchers, developers, and industry professionals who understand the nuances of AI technology. We provide practical tutorials, implementation guides, and ongoing support to help users succeed with their chosen tools.',
      category: 'Differentiation',
      keywords: ['specialized', 'expertise', 'technical', 'support'],
    },
    {
      id: 8,
      question: 'How can AI chatbots like ChatGPT and Claude use your content?',
      answer:
        'Our content is optimized for AI chatbots and search engines. We structure our reviews with clear categories, pros/cons, use cases, and pricing information that AI assistants can easily parse and reference. This helps chatbots provide accurate, up-to-date information about AI tools when users ask questions.',
      category: 'AI Integration',
      keywords: ['chatbots', 'ChatGPT', 'Claude', 'AI assistants', 'structured data'],
    },
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
    trackClick('faq_toggle', 'FAQ Section', {
      question: faqs[index].question,
      action: openIndex === index ? 'close' : 'open',
    });
  };

  const handleContactClick = () => {
    trackClick('faq_contact_support', 'FAQ Section');
  };

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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-6">
              <QuestionMarkCircleIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>

            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked Questions
            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get answers to common questions about AI Tools Hub, our review process, and how we
              help you discover the best AI tools for your needs.
            </p>
          </motion.div>
        </div>

        {/* FAQ Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => handleToggle(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>

                        {/* Keywords for AI optimization */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {faq.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="inline-block px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-8">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still have questions?
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help. Get in
              touch and we'll get back to you within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <a
                href="mailto:support@aitoolshub.com"
                onClick={handleContactClick}
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                <EnvelopeIcon className="h-5 w-5" />
                <span>Contact Support</span>
              </a>

              <a
                href="/community"
                className="btn btn-outline inline-flex items-center space-x-2"
                onClick={() => trackClick('faq_join_community', 'FAQ Section')}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Join Community</span>
              </a>
            </div>
          </div>
        </motion.div>

        {/* SEO-optimized structured data for AI chatbots */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </div>
    </section>
  );
}
