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
    console.log('========= Starting Share Invite Email Function =========');
    
    // Verify environment variables first
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Missing email configuration:', {
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPass: !!process.env.EMAIL_PASS
        });
        throw new Error('Email configuration missing');
    }

    // Create reusable transporter with detailed logging
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        debug: true, // show debug output
        logger: true // log information in console
    });

    const invite = snap.data() as ShareInvite;
    console.log('Share invite data:', {
        inviteId: snap.id,
        contractId: invite.contractId,
        recipientEmail: invite.email
    });

    try {
        // Test SMTP connection first
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        console.log('Fetching contract details');
        const contractSnapshot = await admin.firestore()
            .collection('contracts')
            .doc(invite.contractId)
            .get();
        
        const contract = contractSnapshot.data() as Contract | undefined;
        
        if (!contract) {
            console.error('Contract not found for ID:', invite.contractId);
            return;
        }
        console.log('Contract found:', { title: contract.title, id: invite.contractId });

        const acceptUrl = `${process.env.APP_URL || 'http://localhost:8080'}/accept-invite/${snap.id}`;
        console.log('Generated accept URL:', acceptUrl);

        const mailOptions = {
            from: `"WWF Admin" <${process.env.EMAIL_USER}>`,
            to: invite.email,
            subject: `You've been invited to view a contract`,
            html: `
                <h2>Contract Share Invitation</h2>
                <p>You have been invited to view the contract "${contract.title}".</p>
                <p>Click the link below to accept the invitation:</p>
                <a href="${acceptUrl}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #0066cc;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">Accept Invitation</a>
                <p>If you can't click the button, copy and paste this link into your browser:</p>
                <p>${acceptUrl}</p>
            `
        };

        console.log('Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected,
            envelope: info.envelope
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error in email sending process:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error('Failed to send share invite email');
    }
};