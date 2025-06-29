import { defineEventHandler, readBody, createError } from 'h3'
import { getStripe } from '../utils/stripe'

export default defineEventHandler(async (event) => {
  try {
    const stripe = getStripe()
    const body = await readBody(event)
    const config = useRuntimeConfig()

    // Validate that we have either productId or amount
    if (!body.productId && !body.amount) {
      throw createError({
        statusCode: 400,
        message: 'Either productId or amount is required'
      })
    }

    // Extract common parameters
    const success_url = body.success_url || `${config.public.baseUrl}/thank-you`
    const cancel_url = body.cancel_url || `${config.public.baseUrl}/blog`

    let lineItems = []

    if (body.productId) {
      // Product-based checkout
      const product = await stripe.products.retrieve(body.productId)
      
      if (!product.default_price) {
        throw createError({
          statusCode: 400,
          message: 'Product does not have a default price'
        })
      }

      const price = await stripe.prices.retrieve(product.default_price as string)

      lineItems = [{
        price: price.id,
        quantity: 1
      }]
    } else {
      // Custom amount checkout
      if (!body.amount || body.amount <= 0) {
        throw createError({
          statusCode: 400,
          message: 'Amount must be greater than 0'
        })
      }

      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: body.productName || 'Support EJ Fox',
            description: body.productDescription || 'One-time support for writing and open source work'
          },
          unit_amount: Math.round(body.amount)
        },
        quantity: 1
      }]
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url,
      cancel_url
    })

    if (!session?.url) {
      throw new Error('No checkout URL received from Stripe')
    }

    // Return consistent response format
    return {
      statusCode: 200,
      body: {
        id: session.id,
        url: session.url
      }
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeError') {
      throw createError({
        statusCode: 400,
        message: error.message
      })
    }

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }

    // Generic error
    throw createError({
      statusCode: 500,
      message: error.message || 'Error creating checkout session'
    })
  }
})