export const CACHE_KEYS = {
  QUOTA: 'walkimpact:quota',
  EVENT_DATA: 'walkimpact:event:active',
  FAQS: 'walkimpact:faqs',
} as const

export const QUOTA_TTL = 60 // seconds
export const EVENT_DATA_TTL = 300 // 5 minutes
export const FAQS_TTL = 600 // 10 minutes
