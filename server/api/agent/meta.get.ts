/**
 * @file agent/meta.get.ts
 * @description Machine-readable API schema and capabilities discovery for AI agents to query personal data
 * @endpoint GET /api/agent/meta
 * @returns Complete API documentation including available endpoints, schemas, data availability, usage guidelines, and philosophical principles
 */

export default defineEventHandler(async () => {
  return {
    version: '1.0.0',
    updated: new Date().toISOString(),

    identity: {
      name: 'EJ Fox',
      username: 'ejfox',
      bio: 'Hacker, journalist, data visualization specialist',
      website: 'https://ejfox.com',
      github: 'https://github.com/ejfox',
      // Note: No specific location, contact info, or real-time whereabouts
      // to prevent doxxing/harassment vectors
    },

    capabilities: {
      endpoints: [
        {
          path: '/api/agent/meta',
          description: 'This endpoint. Describes available data and schemas.',
          format: 'application/json',
        },
        {
          path: '/api/agent/timeline',
          description: 'Chronological life events and milestones',
          format: 'application/json',
          parameters: {
            from: {
              type: 'string',
              format: 'YYYY-MM-DD',
              description: 'Start date',
            },
            to: {
              type: 'string',
              format: 'YYYY-MM-DD',
              description: 'End date',
            },
            limit: { type: 'number', default: 100 },
          },
        },
        {
          path: '/api/stats',
          description: 'Real-time stats: GitHub, chess, music, reading',
          format: 'application/json',
        },
        {
          path: '/api/predictions',
          description: 'All predictions with confidence scores and updates',
          format: 'application/json',
        },
        {
          path: '/api/reading',
          description: 'Book collection with highlights and annotations',
          format: 'application/json',
        },
      ],

      schemas: {
        thought: {
          description: 'A piece of intellectual output',
          properties: {
            type: {
              type: 'string',
              enum: ['post', 'prediction', 'prediction_update', 'note'],
            },
            timestamp: { type: 'string', format: 'ISO 8601' },
            content: {
              type: 'string',
              description: 'Main content or statement',
            },
            metadata: {
              type: 'object',
              description: 'Type-specific additional data',
            },
          },
        },

        event: {
          description: 'A life event or milestone',
          properties: {
            timestamp: { type: 'string', format: 'ISO 8601' },
            type: {
              type: 'string',
              enum: [
                'post',
                'prediction',
                'project',
                'achievement',
                'milestone',
              ],
            },
            title: { type: 'string' },
            description: { type: 'string' },
            url: {
              type: 'string',
              description: 'Link to full content if available',
            },
          },
        },
      },
    },

    dataAvailability: {
      blogPosts: {
        count: 'dynamic',
        earliest: '2010',
        latest: 'current',
        description: 'Technical writing, week notes, tutorials',
      },
      predictions: {
        count: 'dynamic',
        earliest: '2025',
        latest: 'current',
        description:
          'Calibrated predictions with confidence scores and update trails',
      },
      reading: {
        count: 'dynamic',
        earliest: '2011',
        latest: 'current',
        description: 'Books with Kindle highlights and annotations',
      },
      code: {
        source: 'GitHub API',
        realtime: true,
        description: 'Commit history, repositories, contributions',
      },
      activity: {
        sources: ['LastFM', 'Chess.com', 'RescueTime'],
        realtime: true,
        description: 'Music, chess games, productivity metrics',
      },
    },

    usage: {
      rateLimit: 'None currently - please be respectful',
      authentication: 'None required for public endpoints',
      cors: 'Enabled for all origins',
      caching: 'CDN cached, 5min for /api/*, 1hr for /api/agent/*',
      safety:
        'Only publicly-published content. No real-time location, contact info, or private data.',
    },

    philosophy: {
      purpose:
        'Personal API for future AI agents to query my life, beliefs, and work',
      inspiration:
        'Cyberpunk self-panopticon, quantified self, digital permanence',
      principles: [
        'Machine-readable first, human-readable second',
        'Chronological integrity - no editing history',
        'Cryptographic verification where possible',
        'Public by default, private by exception',
      ],
    },
  }
})
