import { describe, it, expect } from 'vitest'
import { usePredictions } from '../composables/usePredictions'

describe('usePredictions', () => {
  it('should calculate stats correctly', () => {
    const { stats } = usePredictions()
    
    // Mock some predictions
    predictions.value = [
      { id: '1', resolved: null },
      { id: '2', resolved: { correct: true, date: '2025-01-01' } },
      { id: '3', resolved: { correct: false, date: '2025-01-02' } },
      { id: '4', resolved: { correct: true, date: '2025-01-03' } }
    ]
    
    expect(stats.value.total).toBe(4)
    expect(stats.value.pending).toBe(1)
    expect(stats.value.resolved).toBe(3)
    expect(stats.value.correct).toBe(2)
    expect(stats.value.accuracy).toBe(66.7)
  })
  
  it('should filter by category', () => {
    const { filteredPredictions, filterCategory } = usePredictions()
    
    predictions.value = [
      { id: '1', categories: ['tech', 'ai'] },
      { id: '2', categories: ['climate'] },
      { id: '3', categories: ['tech', 'business'] }
    ]
    
    filterCategory.value = 'tech'
    
    expect(filteredPredictions.value.length).toBe(2)
    expect(filteredPredictions.value.map(p => p.id)).toEqual(['1', '3'])
  })
})