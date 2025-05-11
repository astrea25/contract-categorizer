import { differenceInDays, isWeekend } from 'date-fns';

/**
 * Calculates the number of business days (excluding weekends) between two dates
 *
 * @param startDate The start date
 * @param endDate The end date
 * @returns The number of business days between the two dates
 */
export const differenceInBusinessDays = (startDate: Date, endDate: Date): number => {
  // Ensure startDate is before endDate
  const start = startDate < endDate ? startDate : endDate;
  const end = startDate < endDate ? endDate : startDate;

  // Calculate total days
  const totalDays = differenceInDays(end, start);

  // Count weekend days
  let weekendDays = 0;
  const currentDate = new Date(start);

  // Iterate through each day and count weekends
  for (let i = 0; i < totalDays; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isWeekend(currentDate)) {
      weekendDays++;
    }
  }

  // Return business days (total days minus weekend days)
  return totalDays - weekendDays;
};

/**
 * Determines the appropriate inactivity notification threshold based on contract status and role
 *
 * @param contract The contract object
 * @param isApprover Whether the recipient is an approver (legal, management, or approver team)
 * @returns The number of business days before sending an inactivity notification
 */
export const getInactivityThreshold = (contract: any, isApprover: boolean): number => {
  const status = contract.status || '';

  // Check if contract has specific thresholds set
  if (isApprover && contract.reviewerInactivityDays !== undefined) {
    return contract.reviewerInactivityDays;
  } else if (!isApprover && contract.regularInactivityDays !== undefined) {
    return contract.regularInactivityDays;
  }

  // For backward compatibility, check the legacy field
  if (contract.inactivityNotificationDays !== undefined) {
    return contract.inactivityNotificationDays;
  }

  // Use default thresholds based on role
  if (isApprover ||
      status.includes('review') ||
      status.includes('approval') ||
      status.includes('send_back') ||
      status.includes('declined')) { // For backward compatibility
    return 3; // 3 business days for approvers/reviewers
  }

  // For all other cases, use 1 business day (24 hours)
  return 1; // 1 business day for everyone else
};
