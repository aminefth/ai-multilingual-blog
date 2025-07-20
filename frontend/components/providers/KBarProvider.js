'use client';

import {
  BookOpenIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  HomeIcon,
  LanguageIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  TagIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useMatches,
} from 'kbar';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from './AuthProvider';

const searchStyle = {
  padding: '12px 16px',
  fontSize: '16px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  border: 'none',
  background: 'var(--background)',
  color: 'var(--foreground)',
};

const animatorStyle = {
  maxWidth: '600px',
  width: '100%',
  background: 'var(--background)',
  color: 'var(--foreground)',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 16px 70px rgb(0 0 0 / 20%)',
  border: '1px solid var(--border)',
};

const groupNameStyle = {
  padding: '8px 16px',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--muted-foreground)',
  background: 'var(--muted)',
};

function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div style={groupNameStyle}>{item}</div>
        ) : (
          <ResultItem action={item} active={active} currentRootActionId={rootActionId} />
        )
      }
    />
  );
}

const ResultItem = React.forwardRef(({ action, active, currentRootActionId }, ref) => {
  const ancestors = React.useMemo(() => {
    if (!currentRootActionId) return action.ancestors;
    const index = action.ancestors.findIndex((ancestor) => ancestor.id === currentRootActionId);
    return action.ancestors.slice(index + 1);
  }, [action.ancestors, currentRootActionId]);

  return (
    <div
      ref={ref}
      style={{
        padding: '12px 16px',
        background: active ? 'var(--accent)' : 'transparent',
        borderLeft: `2px solid ${active ? 'var(--accent-foreground)' : 'transparent'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '14px',
        }}
      >
        {action.icon && action.icon}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            {ancestors.length > 0 &&
              ancestors.map((ancestor) => (
                <React.Fragment key={ancestor.id}>
                  <span
                    style={{
                      opacity: 0.5,
                      marginRight: 8,
                    }}
                  >
                    {ancestor.name}
                  </span>
                  <span
                    style={{
                      marginRight: 8,
                    }}
                  >
                    &rsaquo;
                  </span>
                </React.Fragment>
              ))}
            <span>{action.name}</span>
          </div>
          {action.subtitle && (
            <span style={{ fontSize: '12px', opacity: 0.6 }}>{action.subtitle}</span>
          )}
        </div>
      </div>
      {action.shortcut?.length ? (
        <div aria-hidden style={{ display: 'grid', gridAutoFlow: 'column', gap: '4px' }}>
          {action.shortcut.map((sc) => (
            <kbd
              key={sc}
              style={{
                padding: '4px 6px',
                background: 'rgba(0 0 0 / .1)',
                borderRadius: '4px',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              {sc}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
});

ResultItem.displayName = 'ResultItem';

export default function KBarProviderWrapper({ children }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale, availableLocales } = useI18n();
  const { user, isAuthenticated } = useAuth();

  const actions = useMemo(() => {
    const baseActions = [
      // Navigation
      {
        id: 'home',
        name: t('navigation.home'),
        shortcut: ['g', 'h'],
        keywords: 'home accueil inicio',
        section: t('kbar.sections.navigation'),
        perform: () => router.push('/'),
        icon: <HomeIcon className="w-4 h-4" />,
      },
      {
        id: 'blog',
        name: t('navigation.blog'),
        shortcut: ['g', 'b'],
        keywords: 'blog articles posts',
        section: t('kbar.sections.navigation'),
        perform: () => router.push('/blog'),
        icon: <DocumentTextIcon className="w-4 h-4" />,
      },
      {
        id: 'categories',
        name: t('navigation.categories'),
        shortcut: ['g', 'c'],
        keywords: 'categories catégories categorías',
        section: t('kbar.sections.navigation'),
        perform: () => router.push('/categories'),
        icon: <TagIcon className="w-4 h-4" />,
      },
      {
        id: 'tools',
        name: t('navigation.tools'),
        shortcut: ['g', 't'],
        keywords: 'tools outils herramientas',
        section: t('kbar.sections.navigation'),
        perform: () => router.push('/tools'),
        icon: <BookOpenIcon className="w-4 h-4" />,
      },
      {
        id: 'search',
        name: t('kbar.actions.search'),
        shortcut: ['/', 's'],
        keywords: 'search recherche buscar',
        section: t('kbar.sections.navigation'),
        perform: () => router.push('/search'),
        icon: <MagnifyingGlassIcon className="w-4 h-4" />,
      },

      // Theme
      {
        id: 'theme',
        name: t('kbar.actions.theme'),
        keywords: 'theme dark light mode',
        section: t('kbar.sections.preferences'),
        icon: theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />,
      },
      {
        id: 'theme-light',
        name: t('theme.light'),
        keywords: 'light mode clair',
        section: t('kbar.sections.preferences'),
        perform: () => setTheme('light'),
        parent: 'theme',
        icon: <SunIcon className="w-4 h-4" />,
      },
      {
        id: 'theme-dark',
        name: t('theme.dark'),
        keywords: 'dark mode sombre',
        section: t('kbar.sections.preferences'),
        perform: () => setTheme('dark'),
        parent: 'theme',
        icon: <MoonIcon className="w-4 h-4" />,
      },
      {
        id: 'theme-system',
        name: t('theme.system'),
        keywords: 'system auto système',
        section: t('kbar.sections.preferences'),
        perform: () => setTheme('system'),
        parent: 'theme',
        icon: <CogIcon className="w-4 h-4" />,
      },

      // Language
      {
        id: 'language',
        name: t('kbar.actions.language'),
        keywords: 'language langue idioma',
        section: t('kbar.sections.preferences'),
        icon: <LanguageIcon className="w-4 h-4" />,
      },
    ];

    // Add language options
    availableLocales.forEach((lang) => {
      baseActions.push({
        id: `language-${lang.code}`,
        name: lang.name,
        keywords: `${lang.name} ${lang.nativeName}`,
        section: t('kbar.sections.preferences'),
        perform: () => setLocale(lang.code),
        parent: 'language',
        icon: <LanguageIcon className="w-4 h-4" />,
      });
    });

    // Add authenticated user actions
    if (isAuthenticated) {
      baseActions.push(
        {
          id: 'profile',
          name: t('navigation.profile'),
          shortcut: ['g', 'p'],
          keywords: 'profile profil perfil',
          section: t('kbar.sections.account'),
          perform: () => router.push('/profile'),
          icon: <UserIcon className="w-4 h-4" />,
        },
        {
          id: 'dashboard',
          name: t('navigation.dashboard'),
          shortcut: ['g', 'd'],
          keywords: 'dashboard tableau panel',
          section: t('kbar.sections.account'),
          perform: () => router.push('/dashboard'),
          icon: <ChartBarIcon className="w-4 h-4" />,
        },
      );

      // Add admin actions for admin users
      if (user?.role === 'admin') {
        baseActions.push(
          {
            id: 'admin',
            name: t('navigation.admin'),
            shortcut: ['g', 'a'],
            keywords: 'admin administration',
            section: t('kbar.sections.admin'),
            perform: () => router.push('/admin'),
            icon: <CogIcon className="w-4 h-4" />,
          },
          {
            id: 'create-post',
            name: t('kbar.actions.createPost'),
            shortcut: ['c', 'p'],
            keywords: 'create post article nouveau',
            section: t('kbar.sections.admin'),
            perform: () => router.push('/admin/posts/new'),
            icon: <PlusIcon className="w-4 h-4" />,
          },
          {
            id: 'analytics',
            name: t('navigation.analytics'),
            shortcut: ['g', 'n'],
            keywords: 'analytics statistiques',
            section: t('kbar.sections.admin'),
            perform: () => router.push('/admin/analytics'),
            icon: <ChartBarIcon className="w-4 h-4" />,
          },
        );
      }
    }

    return baseActions;
  }, [router, theme, setTheme, t, locale, setLocale, availableLocales, isAuthenticated, user]);

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner style={{ background: 'rgba(0 0 0 / .8)', zIndex: 9999 }}>
          <KBarAnimator style={animatorStyle}>
            <KBarSearch style={searchStyle} placeholder={t('kbar.placeholder')} />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
}
