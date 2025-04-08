import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

interface ShareInvite {
  contractId: string;
  email: string;
}

interface Contract {
  title: string;
  id: string;
}

export const sendShareInviteHandler = async (snap: QueryDocumentSnapshot) => {

    // Verify environment variables first
    if (!process.env.EMAIL_USER || !process.env.EMAIL_API_KEY) {
        console.error('Missing email configuration:', {
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailApiKey: !!process.env.EMAIL_API_KEY
        });
        throw new Error('Email configuration missing');
    }

    // Create reusable transporter with detailed logging
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_API_KEY // Using API key for Brevo
        },
        debug: true, // show debug output
        logger: true // log information in console
    });

    const invite = snap.data() as ShareInvite;

    try {
        // Test SMTP connection first
        await transporter.verify();

        const contractSnapshot = await admin.firestore()
            .collection('contracts')
            .doc(invite.contractId)
            .get();

        const contract = contractSnapshot.data() as Contract | undefined;

        if (!contract) {
            console.error('Contract not found for ID:', invite.contractId);
            return;
        }

        const appUrl = process.env.APP_URL;

        const mailOptions = {
            from: `"WWF Admin" <${process.env.EMAIL_USER}>`,
            to: invite.email,
            subject: `You've been invited to view a contract`,
            html: `
                <h2>Contract Share Invitation</h2>
                <p>You have been invited to view the contract "${contract.title}".</p>
                <p>Click the link below to view the contract:</p>
                <a href="${appUrl}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #0066cc;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">View Contract</a>
                <p>If you can't click the button, copy and paste this link into your browser:</p>
                <p>${appUrl}</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error in email sending process:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error('Failed to send share invite email');
    }
};