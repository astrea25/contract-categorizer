import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { DocumentSnapshot } from 'firebase-admin/firestore';

interface ShareInvite {
  contractId: string;
  email: string;
  role: 'viewer' | 'editor';
  invitedBy: string;
}

interface Contract {
  title: string;
  id: string;
}

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const sendShareInvite = onDocumentCreated('shareInvites/{inviteId}', async (event) => {
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

    const snap = event.data as DocumentSnapshot;
    if (!snap) {
        console.error('No data associated with the event');
        return;
    }

    const invite = snap.data() as ShareInvite;
    console.log('Share invite data:', {
        inviteId: snap.id,
        contractId: invite.contractId,
        recipientEmail: invite.email,
        role: invite.role,
        invitedBy: invite.invitedBy
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

        console.log('Fetching inviter details');
        try {
            const inviterResult = await admin.auth().getUser(invite.invitedBy);
            const inviter = inviterResult.email;
            console.log('Inviter details:', {
                email: inviter,
                displayName: inviterResult.displayName,
                uid: inviterResult.uid
            });

            const acceptUrl = `${process.env.APP_URL || 'http://localhost:8080'}/accept-invite/${snap.id}`;
            console.log('Generated accept URL:', acceptUrl);

            const mailOptions = {
                from: `"Contract Categorizer" <${process.env.EMAIL_USER}>`,
                to: invite.email,
                subject: `${inviter} shared a contract with you`,
                html: `
                    <h2>Contract Share Invitation</h2>
                    <p>${inviter} has shared the contract "${contract.title}" with you as a ${invite.role}.</p>
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
        } catch (authError) {
            console.error('Error fetching inviter details:', authError);
            throw new Error('Failed to fetch inviter details');
        }
    } catch (error) {
        console.error('Error in email sending process:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error('Failed to send share invite email');
    }
});