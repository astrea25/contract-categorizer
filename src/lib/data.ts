import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { getAuth, deleteUser } from "firebase/auth";
import { auth as firebaseAuth } from "./firebase";

export interface ContractStats {
  totalContracts: number;
  finishedContracts: number;
  pendingApprovalContracts: number;
  expiringContracts: number;
  totalValue: number;
  expiringThisYear: number;
}

export type ContractStatus = 'requested' | 'draft' | 'legal_review' | 'management_review' | 'approval' | 'finished';
export type ContractType = 'service' | 'employment' | 'licensing' | 'nda' | 'partnership';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  contractCount?: number; // Optional for UI display purposes
}

export interface Contract {
  id: string;
  title: string;
  projectName: string;
  type: ContractType;
  status: ContractStatus;
  owner: string;
  folderId?: string; // Optional reference to the folder ID
  parties: {
    name: string;
    email: string;
    role: string;
  }[];
  startDate: string;
  endDate: string | null;
  value: number | null;
  description: string;
  documentLink?: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: {
    email: string;
    role: 'viewer' | 'editor';
    inviteStatus: 'pending' | 'accepted';
  }[];
  timeline?: {
    timestamp: string;
    action: string;
    userEmail: string;
    details?: string;
  }[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  userEmail: string;
  userName?: string; // Display name for the comment
  timestamp: string;
  replies?: Comment[];
}

export interface ShareInvite {
  contractId: string;
  email: string;
}

export const statusColors: Record<ContractStatus, { bg: string; text: string; border: string }> = {
  requested: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-800', 
    border: 'border-blue-200' 
  },
  draft: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    border: 'border-gray-200' 
  },
  legal_review: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-800', 
    border: 'border-purple-200' 
  },
  management_review: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-800', 
    border: 'border-orange-200' 
  },
  approval: { 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-800', 
    border: 'border-yellow-200' 
  },
  finished: { 
    bg: 'bg-green-50', 
    text: 'text-green-800', 
    border: 'border-green-200' 
  }
};

export const contractTypeLabels: Record<ContractType, string> = {
  service: 'Service Agreement',
  employment: 'Employment Contract',
  licensing: 'Licensing Agreement',
  nda: 'Non-Disclosure Agreement',
  partnership: 'Partnership Agreement'
};

export const getContracts = async (): Promise<Contract[]> => {
  const contractsCollection = collection(db, 'contracts');
  const contractsSnapshot = await getDocs(contractsCollection);
  return contractsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.createdAt) : null,
      startDate: data.startDate,
      endDate: data.endDate,
      documentLink: data.documentLink,
    } as Contract;
  });
};

export const getContract = async (id: string): Promise<Contract | null> => {
  const contractDoc = doc(db, 'contracts', id);
  const contractSnapshot = await getDoc(contractDoc);
  
  if (!contractSnapshot.exists()) {
    return null;
  }
  
  const data = contractSnapshot.data();
  return {
    id: contractSnapshot.id,
    ...data,
    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
    updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.createdAt) : null,
    startDate: data.startDate,
    endDate: data.endDate,
    documentLink: data.documentLink,
  } as Contract;
};

export const createContract = async (
  contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>,
  creatorEmail: string
): Promise<string> => {
  const now = Timestamp.now();
  const initialStatus = contract.status || 'draft';
  const formattedStatus = initialStatus
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const contractToCreate = {
    ...contract,
    createdAt: now,
    updatedAt: now,
    timeline: [{
      timestamp: now.toDate().toISOString(),
      action: `Contract Created with ${formattedStatus} Status`,
      userEmail: creatorEmail,
      details: 'Contract was initially created'
    }]
  };
  const docRef = await addDoc(collection(db, 'contracts'), contractToCreate);
  return docRef.id;
};

export const updateContract = async (id: string, contract: Partial<Omit<Contract, 'id' | 'createdAt'>>, editorEmail: string): Promise<void> => {
  const contractRef = doc(db, 'contracts', id);
  const currentContract = await getContract(id);
  
  if (!currentContract) {
    throw new Error('Contract not found');
  }
  
  // Determine what changed
  const changes: string[] = [];
  let statusChanged = false;
  let newStatus = '';
  
  if (contract.title && contract.title !== currentContract.title) {
    changes.push('title');
  }
  if (contract.status && contract.status !== currentContract.status) {
    changes.push('status');
    statusChanged = true;
    newStatus = contract.status;
  }
  if (contract.projectName && contract.projectName !== currentContract.projectName) {
    changes.push('project name');
  }
  if (contract.value !== undefined && contract.value !== currentContract.value) {
    changes.push('contract value');
  }
  if (contract.description && contract.description !== currentContract.description) {
    changes.push('description');
  }
  if (contract.startDate && contract.startDate !== currentContract.startDate) {
    changes.push('start date');
  }
  if (contract.endDate !== undefined && contract.endDate !== currentContract.endDate) {
    changes.push('end date');
  }
  if (contract.documentLink !== undefined && contract.documentLink !== currentContract.documentLink) {
    changes.push('document link');
  }
  
  // More robust comparison for parties
  if (contract.parties) {
    const partiesChanged = arePartiesDifferent(contract.parties, currentContract.parties);
    if (partiesChanged) {
      changes.push('parties');
    }
  }
  
  // Create a timeline entry if changes were made
  const now = Timestamp.now();
  const existingTimeline = currentContract.timeline || [];
  let timeline = [...existingTimeline];
  
  if (changes.length > 0) {
    // If status changed, use that as the primary action
    const action = statusChanged 
      ? `Status Changed to ${newStatus
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}`
      : 'Contract Edited';
      
    timeline.push({
      timestamp: now.toDate().toISOString(),
      action,
      userEmail: editorEmail,
      details: `Changed: ${changes.join(', ')}`
    });
  }
  
  await updateDoc(contractRef, {
    ...contract,
    updatedAt: now,
    timeline
  });
};

// Helper function to properly compare parties arrays
const arePartiesDifferent = (newParties: any[], oldParties: any[]): boolean => {
  if (newParties.length !== oldParties.length) {
    return true;
  }
  
  // Sort both arrays to ensure consistent comparison
  const sortParties = (p: any[]) => [...p].sort((a, b) => 
    (a.name + a.email + a.role).localeCompare(b.name + b.email + b.role)
  );
  
  const sortedNewParties = sortParties(newParties);
  const sortedOldParties = sortParties(oldParties);
  
  // Compare each party's properties
  for (let i = 0; i < sortedNewParties.length; i++) {
    const newParty = sortedNewParties[i];
    const oldParty = sortedOldParties[i];
    
    if (
      newParty.name !== oldParty.name ||
      newParty.email !== oldParty.email ||
      newParty.role !== oldParty.role
    ) {
      return true;
    }
  }
  
  return false;
};

export const deleteContract = async (id: string): Promise<void> => {
  const contractRef = doc(db, 'contracts', id);
  await deleteDoc(contractRef);
};

export const createShareInvite = async (contractId: string, email: string): Promise<void> => {
  const invitesRef = collection(db, 'shareInvites');
  await addDoc(invitesRef, {
    contractId,
    email: email.toLowerCase()
  });

  // Update contract's sharedWith array
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);
  
  if (contract) {
    const updatedSharedWith = [...(contract.sharedWith || []), {
      email: email.toLowerCase(),
      role: 'viewer',
      inviteStatus: 'pending'
    }];
    await updateDoc(contractRef, { sharedWith: updatedSharedWith });
  }
};

// Check if a user is allowed to access the application
export const isUserAllowed = async (email: string): Promise<boolean> => {
  if (!email) return false;

  // Check admin collection first
  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  if (!adminSnapshot.empty) {
    return true; // User is an admin
  }

  // Check if user is in users collection (newly registered users)
  const usersRef = collection(db, 'users');
  const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    return true; // User exists in users collection
  }

  // If not an admin or registered user, check shareInvites collection
  const shareInvitesRef = collection(db, 'shareInvites');
  const shareQuery = query(shareInvitesRef, where('email', '==', email.toLowerCase()));
  const shareSnapshot = await getDocs(shareQuery);
  
  return !shareSnapshot.empty; // User is either invited or not
};

// Check if a user is an admin
export const isUserAdmin = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  return !adminSnapshot.empty;
};

// Add an admin user (for testing)
export const addAdminUser = async (email: string): Promise<void> => {
  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  if (adminSnapshot.empty) {
    await addDoc(adminRef, {
      email: email.toLowerCase(),
      createdAt: new Date().toISOString()
    });
  }
};

// Remove an admin user
export const removeAdminUser = async (id: string): Promise<void> => {
  const adminRef = doc(db, 'admin', id);
  await deleteDoc(adminRef);
};

export const updateInviteStatus = async (inviteId: string, status: 'accepted'): Promise<void> => {
  const contractRef = doc(db, 'contracts', inviteId);
  const contract = await getContract(inviteId);
  
  if (contract) {
    const updatedSharedWith = contract.sharedWith.map(share =>
      share.inviteStatus === 'pending' ? { ...share, inviteStatus: status } : share
    );
    await updateDoc(contractRef, { sharedWith: updatedSharedWith });
  }
};

export const getSharedContracts = async (userEmail: string): Promise<Contract[]> => {
  const contracts = await getContracts();
  return contracts.filter(contract =>
    contract.sharedWith?.some(share =>
      share.email === userEmail && share.inviteStatus === 'accepted'
    )
  );
};

export const filterByStatus = (contracts: Contract[], status?: ContractStatus | 'all'): Contract[] => {
  if (!status || status === 'all') return contracts;
  return contracts.filter(contract => contract.status === status);
};

export const filterByType = (contracts: Contract[], type?: ContractType | 'all'): Contract[] => {
  if (!type || type === 'all') return contracts;
  return contracts.filter(contract => contract.type === type);
};

export const filterByProject = (contracts: Contract[], project?: string): Contract[] => {
  if (!project) return contracts;
  return contracts.filter(contract => 
    contract.projectName.toLowerCase().includes(project.toLowerCase())
  );
};

export const filterByOwner = (contracts: Contract[], owner?: string): Contract[] => {
  if (!owner) return contracts;
  return contracts.filter(contract =>
    contract.parties.some(party =>
      (party.name.toLowerCase().includes(owner.toLowerCase()) ||
       party.email.toLowerCase().includes(owner.toLowerCase())) &&
      party.role.toLowerCase() === 'owner'
    )
  );
};

export const filterByParty = (contracts: Contract[], party?: string): Contract[] => {
  if (!party) return contracts;
  return contracts.filter(contract => 
    contract.parties.some(p => 
      p.name.toLowerCase().includes(party.toLowerCase()) ||
      p.email.toLowerCase().includes(party.toLowerCase())
    )
  );
};

export const filterByDateRange = (
  contracts: Contract[], 
  startDate?: string | null, 
  endDate?: string | null
): Contract[] => {
  if (!startDate && !endDate) return contracts;
  
  return contracts.filter(contract => {
    if (startDate && contract.startDate) {
      if (new Date(contract.startDate) < new Date(startDate)) {
        return false;
      }
    }
    
    if (endDate && contract.endDate) {
      if (new Date(contract.endDate) > new Date(endDate)) {
        return false;
      }
    }
    
    return true;
  });
};

export const getContractStats = async (): Promise<ContractStats> => {
  try {
    const contracts = await getContracts();

    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const totalContracts = contracts.length;
    const finishedContracts = contracts.filter(c => c.status === 'finished').length;
    const pendingApprovalContracts = contracts.filter(c => 
      c.status === 'approval'
    ).length;
    
    const expiringContracts = contracts.filter(c => {
      if (!c.endDate) {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);
        
        if (isNaN(endDate.getTime())) {
          return false;
        }

        const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;
        
        return isExpiringSoon;
      } catch (error) {
        return false;
      }
    }).length;

    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.value || 0);
    }, 0);

    const expiringThisYear = contracts.filter(c => {
      if (!c.endDate) {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);
        
        if (isNaN(endDate.getTime())) {
          return false;
        }

        const isExpiringThisYear = endDate.getFullYear() === currentYear;
        
        return isExpiringThisYear;
      } catch (error) {
        return false;
      }
    }).length;

    const stats = {
      totalContracts,
      finishedContracts,
      pendingApprovalContracts,
      expiringContracts,
      totalValue,
      expiringThisYear
    };

    return stats;
  } catch (error) {
    throw error;
  }
};

// Add a function to register users in the database
export const registerUser = async (
  userId: string, 
  email: string, 
  firstName: string = '',
  lastName: string = '',
  displayName: string = ''
): Promise<void> => {
  const usersRef = collection(db, 'users');
  
  // Check if user already exists
  const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);
  
  // Ensure displayName is set properly
  const finalDisplayName = displayName || `${firstName} ${lastName}`.trim();
  
  if (userSnapshot.empty) {
    // Create a new user document
    console.log('Creating new user with display name:', finalDisplayName);
    await addDoc(usersRef, {
      userId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      displayName: finalDisplayName,
      role: 'user', // Default role
      createdAt: new Date().toISOString(),
    });
    
    // If the user was invited, remove their entry from shareInvites collection
    // since they are now registered and in the users collection
    try {
      const shareInvitesRef = collection(db, 'shareInvites');
      const inviteQuery = query(shareInvitesRef, where('email', '==', email.toLowerCase()));
      const inviteSnapshot = await getDocs(inviteQuery);
      
      if (!inviteSnapshot.empty) {
        // Delete ALL invites for this user (not just the first one)
        const deletePromises = inviteSnapshot.docs.map(inviteDoc => 
          deleteDoc(doc(db, 'shareInvites', inviteDoc.id))
        );
        await Promise.all(deletePromises);
        console.log(`Removed ${inviteSnapshot.docs.length} share invites for registered user:`, email.toLowerCase());
      }
    } catch (error) {
      console.error('Error cleaning up share invite:', error);
      // Continue even if this fails, as the user has been registered successfully
    }
  } else {
    // Update existing user document with the display name
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('Updating existing user:', {
      current: userData.displayName,
      new: finalDisplayName
    });
    
    // Always update with the latest display name
    await updateDoc(doc(db, 'users', userDoc.id), {
      displayName: finalDisplayName || userData.displayName,
      firstName: firstName || userData.firstName || '',
      lastName: lastName || userData.lastName || '',
      updatedAt: new Date().toISOString()
    });
  }
};

// Folder Management Functions
export const getFolders = async (): Promise<Folder[]> => {
  const foldersCollection = collection(db, 'folders');
  const foldersSnapshot = await getDocs(foldersCollection);
  
  const folders = foldersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
    } as Folder;
  });
  
  // For each folder, count how many contracts are assigned to it
  const contracts = await getContracts();
  return folders.map(folder => ({
    ...folder,
    contractCount: contracts.filter(contract => contract.folderId === folder.id).length
  }));
};

export const createFolder = async (
  folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'contractCount'>,
): Promise<string> => {
  const now = Timestamp.now();
  const folderToCreate = {
    ...folder,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'folders'), folderToCreate);
  return docRef.id;
};

export const deleteFolder = async (id: string): Promise<void> => {
  // First, update all contracts in this folder to remove the folder reference
  const contracts = await getContracts();
  const contractsInFolder = contracts.filter(contract => contract.folderId === id);
  
  for (const contract of contractsInFolder) {
    await updateContract(contract.id, { folderId: null }, 'System');
  }
  
  // Then delete the folder
  const folderRef = doc(db, 'folders', id);
  await deleteDoc(folderRef);
};

export const assignContractToFolder = async (contractId: string, folderId: string | null, userEmail: string): Promise<void> => {
  const contractRef = doc(db, 'contracts', contractId);
  const currentContract = await getContract(contractId);
  
  if (!currentContract) {
    throw new Error('Contract not found');
  }
  
  const now = Timestamp.now();
  const existingTimeline = currentContract.timeline || [];
  let timeline = [...existingTimeline];
  
  // Create a timeline entry for the folder change
  timeline.push({
    timestamp: now.toDate().toISOString(),
    action: folderId ? 'Contract Moved to Folder' : 'Contract Removed from Folder',
    userEmail: userEmail,
    details: folderId 
      ? `Contract was moved to a folder`
      : `Contract was removed from its folder`
  });
  
  await updateDoc(contractRef, {
    folderId,
    updatedAt: now,
    timeline
  });
};

// Filter contracts by folder
export const filterByFolder = (contracts: Contract[], folderId?: string | 'all'): Contract[] => {
  if (!folderId || folderId === 'all') return contracts;
  
  return contracts.filter(contract => contract.folderId === folderId);
};

export const renameFolder = async (
  id: string,
  updates: { name?: string; description?: string }
): Promise<void> => {
  const folderRef = doc(db, 'folders', id);
  const now = Timestamp.now();
  
  await updateDoc(folderRef, {
    ...updates,
    updatedAt: now
  });
};

// Add a comment to a contract
export const addComment = async (
  contractId: string,
  text: string,
  userEmail: string,
  userName?: string
): Promise<string> => {
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);
  
  if (!contract) {
    throw new Error('Contract not found');
  }
  
  const now = Timestamp.now();
  const commentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const newComment: Comment = {
    id: commentId,
    text,
    userEmail,
    userName,
    timestamp: now.toDate().toISOString(),
    replies: []
  };
  
  const existingComments = contract.comments || [];
  const updatedComments = [...existingComments, newComment];
  
  await updateDoc(contractRef, {
    comments: updatedComments,
    updatedAt: now
  });
  
  // Also add an entry to the timeline for the comment
  const existingTimeline = contract.timeline || [];
  const updatedTimeline = [...existingTimeline, {
    timestamp: now.toDate().toISOString(),
    action: 'Comment Added',
    userEmail,
    details: text.length > 50 ? `${text.substring(0, 50)}...` : text
  }];
  
  await updateDoc(contractRef, {
    timeline: updatedTimeline
  });
  
  return commentId;
};

// Add a reply to a comment
export const addReply = async (
  contractId: string,
  parentCommentId: string,
  text: string,
  userEmail: string,
  userName?: string
): Promise<string> => {
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);
  
  if (!contract) {
    throw new Error('Contract not found');
  }
  
  const now = Timestamp.now();
  const replyId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const newReply: Comment = {
    id: replyId,
    text,
    userEmail,
    userName,
    timestamp: now.toDate().toISOString()
  };
  
  const existingComments = contract.comments || [];
  
  // Find the parent comment and add the reply
  const updatedComments = existingComments.map(comment => {
    if (comment.id === parentCommentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newReply]
      };
    }
    return comment;
  });
  
  await updateDoc(contractRef, {
    comments: updatedComments,
    updatedAt: now
  });
  
  return replyId;
};

// Delete a comment
export const deleteComment = async (
  contractId: string,
  commentId: string,
  parentCommentId?: string
): Promise<void> => {
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);
  
  if (!contract) {
    throw new Error('Contract not found');
  }
  
  const existingComments = contract.comments || [];
  let updatedComments;
  
  if (parentCommentId) {
    // It's a reply - find the parent and remove the reply
    updatedComments = existingComments.map(comment => {
      if (comment.id === parentCommentId) {
        return {
          ...comment,
          replies: (comment.replies || []).filter(reply => reply.id !== commentId)
        };
      }
      return comment;
    });
  } else {
    // It's a top-level comment - remove it completely
    updatedComments = existingComments.filter(comment => comment.id !== commentId);
  }
  
  await updateDoc(contractRef, {
    comments: updatedComments,
    updatedAt: Timestamp.now()
  });
};

// Add a user to the legal team
export const addLegalTeamMember = async (
  email: string, 
  displayName: string = '',
  role: string = 'Legal Reviewer'
): Promise<void> => {
  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamQuery = query(legalTeamRef, where('email', '==', email.toLowerCase()));
  const legalTeamSnapshot = await getDocs(legalTeamQuery);

  if (legalTeamSnapshot.empty) {
    await addDoc(legalTeamRef, {
      email: email.toLowerCase(),
      displayName,
      role,
      createdAt: new Date().toISOString()
    });
  }
};

// Get all legal team members
export const getLegalTeamMembers = async (): Promise<any[]> => {
  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamSnapshot = await getDocs(legalTeamRef);
  
  return legalTeamSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Remove a legal team member
export const removeLegalTeamMember = async (id: string): Promise<void> => {
  const legalTeamRef = doc(db, 'legalTeam', id);
  await deleteDoc(legalTeamRef);
};

// Create a general invite for a user
export const inviteUser = async (
  email: string, 
  role: string = 'user',
  invitedBy: string
): Promise<void> => {
  // Add to shareInvites collection so they can access the app
  const invitesRef = collection(db, 'shareInvites');
  
  // Check if invite already exists
  const inviteQuery = query(invitesRef, where('email', '==', email.toLowerCase()));
  const inviteSnapshot = await getDocs(inviteQuery);
  
  if (inviteSnapshot.empty) {
    await addDoc(invitesRef, {
      email: email.toLowerCase(),
      role,
      invitedBy,
      createdAt: new Date().toISOString()
    });
  }
};

// Check if a user is a legal team member
export const isUserLegalTeam = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamQuery = query(legalTeamRef, where('email', '==', email.toLowerCase()));
  const legalTeamSnapshot = await getDocs(legalTeamQuery);

  return !legalTeamSnapshot.empty;
};

// Remove a user from the system
export const removeUser = async (id: string): Promise<void> => {
  // First get the user details to know their email and userId
  const userRef = doc(db, 'users', id);
  const userSnapshot = await getDoc(userRef);
  
  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();
    const email = userData.email?.toLowerCase();
    const userId = userData.userId; // Firebase Auth UID
    
    // Delete the user from users collection
    await deleteDoc(userRef);
    
    // Also remove from shareInvites collection if they have any pending invites
    if (email) {
      try {
        const shareInvitesRef = collection(db, 'shareInvites');
        const inviteQuery = query(shareInvitesRef, where('email', '==', email));
        const inviteSnapshot = await getDocs(inviteQuery);
        
        if (!inviteSnapshot.empty) {
          // Delete any invites for this user
          const deletePromises = inviteSnapshot.docs.map(inviteDoc => 
            deleteDoc(doc(db, 'shareInvites', inviteDoc.id))
          );
          await Promise.all(deletePromises);
          console.log('Removed share invites for user:', email);
        }
      } catch (error) {
        console.error('Error cleaning up share invites for removed user:', error);
        // Continue even if this fails, as the main user has been removed successfully
      }
      
      // Additionally, try to remove the user from Firebase Authentication
      if (userId) {
        try {
          // This will only work for admin-level operations or if the user is the current user
          // For security reasons, regular clients can only delete their own user account
          const currentUser = firebaseAuth.currentUser;
          
          if (currentUser && currentUser.uid === userId) {
            // If removing the current user, we can delete them directly
            await deleteUser(currentUser);
            console.log('Removed user from Firebase Auth:', userId);
          } else {
            // For other users, we can't delete them directly from client-side code
            // We would need a Firebase Admin SDK on a server/cloud function
            console.log('Cannot directly delete other users from Firebase Auth - would need Admin SDK');
          }
        } catch (error) {
          console.error('Error removing user from Firebase Auth:', error);
          // Continue even if this fails, as the user data has been removed
        }
      }
    }
  } else {
    // If user doesn't exist, just exit
    return;
  }
};

// Function to get contracts for a regular user - only returns contracts where the user
// is either the owner or mentioned in the parties list or shared with list
export const getUserContracts = async (userEmail: string): Promise<Contract[]> => {
  if (!userEmail) return [];
  
  const lowercaseEmail = userEmail.toLowerCase();
  
  // Get all contracts
  const contracts = await getContracts();
  
  // Filter contracts to only include those where the user is involved
  return contracts.filter(contract => {
    // Check if user is the owner
    if (contract.owner.toLowerCase() === lowercaseEmail) return true;
    
    // Check if user is in the parties list
    const isParty = contract.parties.some(party => 
      party.email.toLowerCase() === lowercaseEmail
    );
    if (isParty) return true;
    
    // Check if user is in the sharedWith list with accepted status
    const isShared = contract.sharedWith?.some(share => 
      share.email.toLowerCase() === lowercaseEmail && 
      share.inviteStatus === 'accepted'
    );
    if (isShared) return true;
    
    // User is not involved with this contract
    return false;
  });
};

// Function to get contract statistics for a regular user
export const getUserContractStats = async (userEmail: string): Promise<ContractStats> => {
  try {
    // Get only the user's contracts
    const contracts = await getUserContracts(userEmail);

    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const totalContracts = contracts.length;
    const finishedContracts = contracts.filter(c => c.status === 'finished').length;
    const pendingApprovalContracts = contracts.filter(c => 
      c.status === 'approval'
    ).length;
    
    const expiringContracts = contracts.filter(c => {
      if (!c.endDate) {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);
        
        if (isNaN(endDate.getTime())) {
          return false;
        }

        const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;
        
        return isExpiringSoon;
      } catch (error) {
        return false;
      }
    }).length;

    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.value || 0);
    }, 0);

    const expiringThisYear = contracts.filter(c => {
      if (!c.endDate) {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);
        
        if (isNaN(endDate.getTime())) {
          return false;
        }

        const isExpiringThisYear = endDate.getFullYear() === currentYear;
        
        return isExpiringThisYear;
      } catch (error) {
        return false;
      }
    }).length;

    const stats = {
      totalContracts,
      finishedContracts,
      pendingApprovalContracts,
      expiringContracts,
      totalValue,
      expiringThisYear
    };

    return stats;
  } catch (error) {
    throw error;
  }
};
