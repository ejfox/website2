export const usePredictions = () => {
  // Parse predictions from markdown content
  const parsePredictionsFromMarkdown = (content: string) => {
    const predictions: any[] = []
    const sections = content.split('### Prediction')

    sections.slice(1).forEach((section: string) => {
      const lines = section.trim().split('\n')
      const title = lines[0].replace(/^\d+:\s*/, '').trim()

      let confidence = 0
      let deadline = ''
      let description = ''
      let reasoning = ''

      lines.forEach((line: string) => {
        if (line.includes('**Confidence**:')) {
          const match = line.match(/\d+/)
          confidence = parseInt(match?.[0] || '0')
        } else if (line.includes('**Deadline**:')) {
          deadline = line.split(':')[1].trim()
        } else if (line.includes('**Description**:')) {
          description = line.split(':').slice(1).join(':').trim()
        } else if (line.includes('**Reasoning**:')) {
          reasoning = line.split(':').slice(1).join(':').trim()
        }
      })

      predictions.push({
        title,
        confidence,
        deadline,
        description,
        reasoning,
        status: 'pending'
      })
    })

    return predictions as any[]
  }

  // Calculate summary statistics for predictions
  const getStats = (predictions: any[]) => {
    const total = predictions.length
    const resolved = predictions.filter((p) => p.status !== 'pending').length
    const correct = predictions.filter((p) => p.status === 'correct').length
    const avgConfidence =
      predictions.reduce((acc, p) => acc + p.confidence, 0) / total

    return {
      total,
      resolved,
      correct,
      accuracy: resolved > 0 ? ((correct / resolved) * 100).toFixed(1) : null,
      avgConfidence: avgConfidence.toFixed(1)
    }
  }

  return {
    parsePredictionsFromMarkdown,
    getStats
  }
}
