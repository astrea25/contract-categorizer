// sendShareInviteEmail function removed

/**
 * Send a general notification email
 * @param recipientEmail Email address of the recipient
 * @param subject Email subject
 * @param htmlContent HTML content of the email
 * @returns Promise resolving to the API response
 */
export const sendNotificationEmail = async (
  recipientEmail: string,
  subject: string,
  htmlContent: string
): Promise<any> => {
  try {
    // Create email data
    const emailData = {
      sender: {
        name: 'WWF Admin',
        email: 'wwfcontracts@gmail.com'
      },
      to: [
        { email: recipientEmail }
      ],
      subject: subject,
      htmlContent: htmlContent
    };

    // Send the email using Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': import.meta.env.VITE_BREVO_API_KEY
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending notification email via Brevo:', error);
    throw error;
  }
};
