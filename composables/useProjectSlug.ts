import GithubSlugger from 'github-slugger'

interface Project {
  title?: string
  metadata?: {
    title?: string
  }
}

export const useProjectSlug = () => {
  const slugger = new GithubSlugger()

  return {
    getSlug: (project: Project) => {
      const title = project.title || project.metadata?.title || ''
      return slugger.slug(title)
    }
  }
}
