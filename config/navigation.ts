export interface NavItem {
  label: string
  href: string
  external?: boolean
  icon?: string
  primary?: boolean
  mobile?: boolean
}

export const navigationItems: NavItem[] = [
  // Primary navigation (always visible)
  { label: 'Home', href: '/', primary: true },
  { label: 'Projects', href: '/projects', primary: true },
  { label: 'Blog', href: '/blog/', primary: true },
  
  // Secondary navigation (desktop sidebar / mobile more menu)
  { label: 'Photos', href: 'https://ejfox.photos', external: true },
  { label: 'Archive', href: 'https://archive.ejfox.com', external: true },
]

// Filter helpers
export const getPrimaryNav = () => navigationItems.filter(item => item.primary)
export const getSecondaryNav = () => navigationItems.filter(item => !item.primary)
export const getAllNav = () => navigationItems