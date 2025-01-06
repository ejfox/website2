import { defineEventHandler, createError } from 'h3'
import { getStripe } from '../utils/stripe'

export default defineEventHandler(async (event) => {
  try {
    const stripe = getStripe()

    const products = await stripe.products.list({})

    const prices = await Promise.all(
      products.data.map(async (product) => {
        const stripePrices = await stripe.prices.list()

        const stripePrice = stripePrices.data.find((price) => {
          return price.product === product.id
        })

        return {
          ...product,
          price: stripePrice
        }
      })
    )

    products.data = prices

    return new Response(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Stripe products error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch Stripe products'
    })
  }
})
