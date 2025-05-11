import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUnreadNotificationCount, RecipientRole } from '@/lib/notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  loading: false,
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { isAdmin, isLegalTeam, isManagementTeam, isApprover } = useAuth();

  // Determine the user's role
  const getUserRole = (): RecipientRole => {
    if (isAdmin) return 'admin';
    if (isLegalTeam) return 'legal';
    if (isManagementTeam) return 'management';
    if (isApprover) return 'approver';
    return 'user';
  };

  const refreshUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const role = getUserRole();
      const count = await getUnreadNotificationCount(role);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      // Set count to 0 on error to avoid breaking the UI
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isLegalTeam, isManagementTeam, isApprover]);

  useEffect(() => {
    refreshUnreadCount();

    // Set up a polling interval to refresh the count every 30 seconds
    const intervalId = setInterval(refreshUnreadCount, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};
