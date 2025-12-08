export interface NavItem {
  label: string
  href: string
  external?: boolean
  icon?: string
  primary?: boolean
  mobile?: boolean
}

export const navigationItems: NavItem[] = [
  // Minimal sidebar navigation
  { label: 'Home', href: '/', primary: true },
  { label: 'Blog', href: '/blog/', primary: true },
  { label: 'Projects', href: '/projects', primary: true },
  { label: 'Calendar', href: '/calendar', primary: true }, // 💰 Money maker
]

// Filter helpers
export const getPrimaryNav = () =>
  navigationItems.filter((item) => item.primary)
export const getSecondaryNav = () =>
  navigationItems.filter((item) => !item.primary)
export const getAllNav = () => navigationItems
