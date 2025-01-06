import type { Stripe } from 'stripe'
import StripeAPI from 'stripe'

// Initialize Stripe with a type-safe configuration
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new StripeAPI(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' // Use latest API version
    })
  : null

export const getStripe = (): Stripe => {
  if (!stripe) {
    throw new Error(
      'Stripe is not configured. Please check your environment variables.'
    )
  }
  return stripe
}
