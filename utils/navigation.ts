export interface NavItem {
  label: string
  href: string
  external?: boolean
  icon?: string
  primary?: boolean
  mobile?: boolean
  /** Umami event name, rendered as data-umami-event (see CLAUDE.md). */
  umamiEvent?: string
}

export const navigationItems: NavItem[] = [
  // Minimal sidebar navigation
  { label: 'Home', href: '/', primary: true },
  { label: 'Blog', href: '/blog/', primary: true },
  { label: 'Projects', href: '/projects', primary: true },
  { label: 'Photos', href: '/photos', primary: true },
  {
    label: 'Hire Me',
    href: '/consulting',
    primary: true,
    umamiEvent: 'nav-hire-me',
  }, // 💰 Money maker
]

// Filter helpers
export const getPrimaryNav = () =>
  navigationItems.filter((item) => item.primary)
export const getSecondaryNav = () =>
  navigationItems.filter((item) => !item.primary)
export const getAllNav = () => navigationItems
