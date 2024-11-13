import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing Stripe secret key')
    throw createError({
      statusCode: 500,
      message: 'Stripe configuration error'
    })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-10-28.acacia'
  })

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Support EJ Fox',
              description: 'One-time support for writing and open source work'
            },
            unit_amount: Math.round(body.amount)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${config.public.baseUrl}/thank-you`,
      cancel_url: `${config.public.baseUrl}/blog`
    })

    if (!session?.url) {
      throw new Error('No checkout URL received from Stripe')
    }

    return { url: session.url }
  } catch (error: any) {
    console.error('Stripe error details:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error creating checkout session'
    })
  }
}) 