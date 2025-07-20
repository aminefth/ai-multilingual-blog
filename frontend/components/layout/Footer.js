'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';
import {
  SparklesIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
  YoutubeIcon,
  InstagramIcon,
  GithubIcon,
} from 'react-share';

export function Footer() {
  const { t } = useI18n();
  const { trackClick } = useAnalytics();

  const footerSections = [
    {
      title: 'AI Tools',
      links: [
        { name: 'Browse All Tools', href: '/tools' },
        { name: 'Writing AI', href: '/tools/writing' },
        { name: 'Image Generation', href: '/tools/image' },
        { name: 'Code Assistants', href: '/tools/coding' },
        { name: 'Productivity', href: '/tools/productivity' },
        { name: 'New Releases', href: '/tools/new' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '/blog' },
        { name: 'Guides & Tutorials', href: '/guides' },
        { name: 'AI News', href: '/news' },
        { name: 'Tool Comparisons', href: '/comparisons' },
        { name: 'Best Practices', href: '/best-practices' },
        { name: 'Case Studies', href: '/case-studies' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Discord Server', href: '/discord' },
        { name: 'Community Forum', href: '/community' },
        { name: 'Submit a Tool', href: '/submit-tool' },
        { name: 'Become a Reviewer', href: '/become-reviewer' },
        { name: 'Affiliate Program', href: '/affiliate' },
        { name: 'Newsletter', href: '/newsletter' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press Kit', href: '/press' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'Twitter',
      icon: TwitterIcon,
      href: 'https://twitter.com/aitoolshub',
      color: '#1DA1F2',
    },
    {
      name: 'LinkedIn',
      icon: LinkedinIcon,
      href: 'https://linkedin.com/company/aitoolshub',
      color: '#0077B5',
    },
    {
      name: 'YouTube',
      icon: YoutubeIcon,
      href: 'https://youtube.com/@aitoolshub',
      color: '#FF0000',
    },
    {
      name: 'Instagram',
      icon: InstagramIcon,
      href: 'https://instagram.com/aitoolshub',
      color: '#E4405F',
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      href: 'https://facebook.com/aitoolshub',
      color: '#1877F2',
    },
    { name: 'GitHub', icon: GithubIcon, href: 'https://github.com/aitoolshub', color: '#333' },
  ];

  const handleLinkClick = (linkName, section) => {
    trackClick('footer_link', 'Footer', { link: linkName, section });
  };

  const handleSocialClick = (platform) => {
    trackClick('footer_social', 'Footer', { platform });
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-16">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <SparklesIcon className="h-12 w-12 text-primary-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Stay Updated with AI
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Get the latest AI tool reviews, tutorials, and industry insights delivered to your
                inbox weekly.
              </p>

              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary px-8 py-3 whitespace-nowrap"
                  onClick={() => trackClick('footer_newsletter_subscribe', 'Footer')}
                >
                  Subscribe
                </button>
              </form>

              <p className="text-sm text-gray-400 mt-4">
                Join 50,000+ AI enthusiasts. No spam, unsubscribe anytime.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <SparklesIcon className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">AI Tools Hub</span>
            </Link>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Your trusted source for discovering, comparing, and mastering the best AI tools.
              Empowering professionals and businesses with AI-driven solutions.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-4 w-4" />
                <span>hello@aitoolshub.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold mb-6">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                      onClick={() => handleLinkClick(link.name, section.title)}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Social Media & Bottom Section */}
        <div className="border-t border-gray-800 mt-16 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <span className="text-gray-400 text-sm">Follow us:</span>
              <div className="flex items-center space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110"
                      onClick={() => handleSocialClick(social.name)}
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <Icon size={24} round />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center space-x-2">
                <HeartIcon className="h-4 w-4 text-red-500" />
                <span>Trusted by 50K+ Users</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} AI Tools Hub. All rights reserved.
              </p>

              <div className="flex items-center space-x-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => handleLinkClick('Privacy Policy', 'Legal')}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => handleLinkClick('Terms of Service', 'Legal')}
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookies"
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => handleLinkClick('Cookie Policy', 'Legal')}
                >
                  Cookies
                </Link>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-4">
              Made with ❤️ for the AI community. Helping you discover and master the future of
              technology.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
