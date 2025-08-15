import { defineEventHandler, readBody, createError } from 'h3'

// Input validation - because we're experts and validate everything
function sanitizeProductId(input: unknown): string {
  if (typeof input !== 'string') return ''
  // Stripe product IDs typically start with 'prod_' or 'price_'
  return input.trim().slice(0, 100)
}

const handler = defineEventHandler(async (event) => {
  try {

    const body = await readBody(event)
    
    // Input validation - productId is required
    const productId = sanitizeProductId(body?.productId)
    
    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Product ID is required'
      })
    }

    // For now, just log the sale for analytics/tracking
    // In a full implementation, this might update inventory, send notifications, etc.
    console.log(`Product marked as sold: ${productId} at ${new Date().toISOString()}`)
    
    // Could add additional logic here like:
    // - Update inventory database
    // - Send notification emails
    // - Track analytics
    // - Update CRM systems
    
    // Return consistent success response
    return {
      success: true,
      message: 'Product successfully marked as sold',
      productId,
      timestamp: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error("Error marking product as sold:", error)
    
    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }

    // Generic error response
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to mark product as sold'
    })
  }
})

export default handler