export default function (error, event) {
  console.error('Server error:', error)

  // Return a structured error response
  return {
    statusCode: error.statusCode || 500,
    statusMessage: error.statusMessage || 'Internal Server Error',
    data: {
      message: error.message
    }
  }
}
