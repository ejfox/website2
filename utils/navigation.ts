/**
 * @file navigation.ts
 * @description The primary nav items, rendered by layouts/default.vue (sidebar
 *   + mobile nav) via getPrimaryNav(). `umamiEvent` becomes the link's
 *   data-umami-event (see CLAUDE.md "Umami funnel events").
 */
export interface NavItem {
  label: string
  href: string
  external?: boolean
  icon?: string
  primary?: boolean
  /** The funnel step: rendered brighter than the other nav links. */
  cta?: boolean
  mobile?: boolean
  /** Umami event name, rendered as data-umami-event (see CLAUDE.md). */
  umamiEvent?: string
}

export const navigationItems: NavItem[] = [
  // Minimal sidebar navigation
  { label: 'Home', href: '/', primary: true },
  { label: 'Work', href: '/projects', primary: true },
  { label: 'Notebook', href: '/blog/', primary: true },
  {
    label: 'Hire me',
    href: '/consulting',
    primary: true,
    cta: true,
    umamiEvent: 'nav-hire-me',
  }, // 💰 Money maker
]

// Filter helpers
export const getPrimaryNav = () =>
  navigationItems.filter((item) => item.primary)
