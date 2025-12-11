/**
 * Newsletter signup endpoint - adds contacts to Brevo
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/contacts';

module.exports = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY is not configured');
    return res.status(500).json({
      error: 'Newsletter service is not configured',
    });
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

    const data = await response.json();

    if (response.ok || response.status === 201) {
      return res.status(200).json({
        success: true,
        message: 'Successfully subscribed to newsletter',
      });
    }

    // Handle duplicate contact (already subscribed)
    if (response.status === 400 && data.code === 'duplicate_parameter') {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to our newsletter',
        alreadySubscribed: true,
      });
    }

    // Handle other errors
    console.error('Brevo API error:', data);
    return res.status(response.status).json({
      error: data.message || 'Failed to subscribe',
    });

  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res.status(500).json({
      error: 'An error occurred while subscribing',
    });
  }
};
