import GithubSlugger from 'github-slugger'

export const useProjectSlug = () => {
  const slugger = new GithubSlugger()

  return {
    getSlug: (project: any) => {
      const title = project.title || project.metadata?.title || ''
      return slugger.slug(title)
    }
  }
}
