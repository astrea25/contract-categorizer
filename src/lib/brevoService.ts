// sendShareInviteEmail function removed

/**
 * Send a general notification email
 * @param recipientEmail Email address of the recipient
 * @param subject Email subject
 * @param htmlContent HTML content of the email
 * @param textContent Optional plain text content of the email
 * @returns Promise resolving to the API response
 */
export const sendNotificationEmail = async (
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<any> => {
  try {
    // Retrieve sender info from environment variables
    const senderName = import.meta.env.VITE_EMAIL_SENDER_NAME || 'WWF Admin';
    const senderEmail = import.meta.env.VITE_EMAIL_SENDER_ADDRESS || 'noreply@example.com';

    // Create email data
    const emailData: any = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        { email: recipientEmail }
      ],
      subject: subject,
      htmlContent: htmlContent
    };

    // Add textContent if provided
    if (textContent) {
      emailData.textContent = textContent;
    }

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
