import { EMAIL_SENDER_NAME, EMAIL_SENDER_ADDRESS, BREVO_API_KEY } from "./config";

export const sendNotificationEmail = async (
    recipientEmail: string,
    subject: string,
    htmlContent: string,
    textContent?: string
): Promise<any> => {
    try {
        const senderName = EMAIL_SENDER_NAME;
        const senderEmail = EMAIL_SENDER_ADDRESS;

        const emailData: any = {
            sender: {
                name: senderName,
                email: senderEmail
            },

            to: [{
                email: recipientEmail
            }],

            subject: subject,
            htmlContent: htmlContent
        };

        if (textContent) {
            emailData.textContent = textContent;
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",

            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": BREVO_API_KEY
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
        throw error;
    }
};