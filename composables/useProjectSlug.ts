/**
 * @file useProjectSlug.ts
 * @description Extracts URL slug from project objects, falling back to title-based generation
 * @returns { getSlug } - Function to get slug from project object
 */
import GithubSlugger from 'github-slugger'

interface Project {
  slug?: string
  title?: string
  metadata?: {
    title?: string
  }
}

export const useProjectSlug = () => {
  const slugger = new GithubSlugger()

  return {
    getSlug: (project: Project) => {
      if (project.slug) {
        return project.slug.replace(/^projects\//, '')
      }
      const title = project.title || project.metadata?.title || ''
      return slugger.slug(title)
    },
  }
}
