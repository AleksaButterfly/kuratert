/**
 * Newsletter signup endpoint - adds contacts to Brevo
 */

const { serialize } = require('../api-util/sdk');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

module.exports = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ error: 'Email is required' }))
      .end();
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ error: 'Invalid email format' }))
      .end();
  }

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY is not configured');
    return res
      .status(500)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ error: 'Newsletter service is not configured' }))
      .end();
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email: email,
        updateEnabled: true, // Update if contact already exists
        attributes: {
          SIGNUP_SOURCE: 'website_footer',
          SIGNUP_DATE: new Date().toISOString(),
        },
      }),
    });

    // Brevo may return empty body for successful operations
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (response.ok || response.status === 201 || response.status === 204) {
      return res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ success: true, message: 'Successfully subscribed to newsletter' }))
        .end();
    }

    // Handle duplicate contact (already subscribed)
    // Brevo may return 'duplicate_parameter' code or 'Contact already exist' message
    const isDuplicate = data.code === 'duplicate_parameter' ||
                        (data.message && data.message.toLowerCase().includes('already exist'));

    if (response.status === 400 && isDuplicate) {
      return res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ success: true, message: 'You are already subscribed to our newsletter', alreadySubscribed: true }))
        .end();
    }

    // Handle other errors - return actual error message from Brevo
    console.error('Brevo API error:', data);
    return res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ success: false, error: data.message || 'Failed to subscribe' }))
      .end();

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res
      .status(200)
      .set('Content-Type', 'application/transit+json')
      .send(serialize({ success: false, error: error.message || 'An error occurred while subscribing' }))
      .end();
  }
};
