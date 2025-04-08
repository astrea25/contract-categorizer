/**
 * Send a contract share invitation email using Brevo API
 * @param recipientEmail Email address of the recipient
 * @param contractTitle Title of the contract being shared
 * @param contractId ID of the contract
 * @returns Promise resolving to the API response
 */
export const sendShareInviteEmail = async (
  recipientEmail: string,
  contractTitle: string,
  contractId: string
): Promise<any> => {
  try {
    // Construct the contract URL
    const appUrl = import.meta.env.VITE_APP_URL || 'https://contract-management-phi.vercel.app';
    const contractUrl = `${appUrl}/contracts/${contractId}`;

    // Create email data
    const emailData = {
      sender: {
        name: 'WWF Admin',
        email: 'wwfcontracts@gmail.com'
      },
      to: [
        { email: recipientEmail }
      ],
      subject: `You've been invited to view a contract`,
      htmlContent: `
        <h2>Contract Share Invitation</h2>
        <p>You have been invited to view the contract "${contractTitle}".</p>
        <p>Click the link below to view the contract:</p>
        <a href="${contractUrl}" style="
            display: inline-block;
            padding: 10px 20px;
            background-color: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        ">View Contract</a>
        <p>If you can't click the button, copy and paste this link into your browser:</p>
        <p>${contractUrl}</p>
      `
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
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    throw error;
  }
};

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
    console.log('Notification email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification email via Brevo:', error);
    throw error;
  }
};
