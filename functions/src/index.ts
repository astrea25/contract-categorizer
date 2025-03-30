import { onDocumentCreated } from 'firebase-functions/v2/firestore';
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