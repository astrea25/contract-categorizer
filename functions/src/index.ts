import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { sendShareInviteHandler } from './sendShareInvite';

// Initialize Firebase Admin once
admin.initializeApp();

// Export Cloud Functions
export const sendShareInvite = onDocumentCreated('shareInvites/{inviteId}', async (event) => {
  if (!event.data) {
    throw new Error('No data associated with the event');
  }
  return sendShareInviteHandler(event.data);
});

// Create an HTTP endpoint to accept invites
export const acceptInvite = onRequest(async (req, res) => {
  try {
    const inviteId = req.query.id;
    if (!inviteId || typeof inviteId !== 'string') {
      res.status(400).send('Invalid invite ID');
      return;
    }

    // Get the invite
    const inviteRef = admin.firestore().doc(`shareInvites/${inviteId}`);
    const invite = await inviteRef.get();

    if (!invite.exists) {
      res.status(404).send('Invite not found');
      return;
    }

    const inviteData = invite.data();
    if (!inviteData || inviteData.status === 'accepted') {
      res.status(400).send('Invite already accepted or invalid');
      return;
    }

    // Update invite status
    await inviteRef.update({ status: 'accepted' });

    // Update contract's sharedWith array
    const contractRef = admin.firestore().doc(`contracts/${inviteData.contractId}`);
    const contract = await contractRef.get();

    if (!contract.exists) {
      res.status(404).send('Contract not found');
      return;
    }

    const contractData = contract.data();
    if (contractData) {
      const updatedSharedWith = contractData.sharedWith.map((share: any) =>
        share.email === inviteData.email ? { ...share, inviteStatus: 'accepted' } : share
      );
      await contractRef.update({ sharedWith: updatedSharedWith });
    }

    // Redirect to the contract page
    res.redirect(`/contract/${inviteData.contractId}`);
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).send('Internal server error');
  }
});