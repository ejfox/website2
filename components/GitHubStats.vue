const processCommits = computed(() => {
  if (!props.stats?.detail?.commits) return []

  const commits = props.stats.detail.commits
  const grouped = groupBy(commits, (commit) => {
    const date = new Date(commit.date)
    return format(date, 'yyyy-MM-dd')
  })

  return Object.entries(grouped).map(([date, commits]) => ({
    date,
    count: commits.length
  }))
}) 