import { defineEventHandler, readBody } from 'h3'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string)

export default defineEventHandler(async (event) => {
  try {
    // Get data from request body
    const { email, firstName, lastName } = await readBody(event)

    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Please provide a valid email address'
      }
    }

    // Here you would typically add the user to your SendGrid contact list
    // This depends on your SendGrid setup, but we'll use a simple email notification
    // for now to notify you of new signups

    const msg = {
      to: process.env.ADMIN_EMAIL || 'your-email@example.com', // Your admin email
      from: process.env.SENDGRID_FROM_EMAIL || 'your-website@example.com', // Verified sender
      subject: 'New Newsletter Signup',
      text: `New signup from: ${email}\nName: ${firstName || ''} ${
        lastName || ''
      }`.trim(),
      html: `
        <p>New signup from: <strong>${email}</strong></p>
        ${
          firstName || lastName
            ? `<p>Name: ${firstName || ''} ${lastName || ''}</p>`
            : ''
        }
      `
    }

    await sgMail.send(msg)

    // Return success
    return {
      success: true,
      message: 'Thank you for signing up to the newsletter!'
    }
  } catch (error: any) {
    console.error('Newsletter signup error:', error)

    // Return error
    return {
      success: false,
      message: 'Something went wrong. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  }
})
