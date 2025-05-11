/**
 * Calculates the number of business days (excluding weekends) between two dates
 *
 * @param startDate The start date
 * @param endDate The end date
 * @returns The number of business days between the two dates
 */
// Ensure startDate is before endDate
// Calculate total days
// Count weekend days
// Iterate through each day and count weekends
// Return business days (total days minus weekend days)
/**
 * Determines the appropriate inactivity notification threshold based on contract status and role
 *
 * @param contract The contract object
 * @param isApprover Whether the recipient is an approver (legal, management, or approver team)
 * @returns The number of business days before sending an inactivity notification
 */
// Check if contract has specific thresholds set
// For backward compatibility, check the legacy field
// Use default thresholds based on role
// For backward compatibility
// 3 business days for approvers/reviewers
// For all other cases, use 1 business day (24 hours)
// 1 business day for everyone else
import { differenceInDays, isWeekend } from "date-fns";

export const differenceInBusinessDays = (startDate: Date, endDate: Date): number => {
    const start = startDate < endDate ? startDate : endDate;
    const end = startDate < endDate ? endDate : startDate;
    const totalDays = differenceInDays(end, start);
    let weekendDays = 0;
    const currentDate = new Date(start);

    for (let i = 0; i < totalDays; i++) {
        currentDate.setDate(currentDate.getDate() + 1);

        if (isWeekend(currentDate)) {
            weekendDays++;
        }
    }

    return totalDays - weekendDays;
};

export const getInactivityThreshold = (contract: any, isApprover: boolean): number => {
    const status = contract.status || "";

    if (isApprover && contract.reviewerInactivityDays !== undefined) {
        return contract.reviewerInactivityDays;
    } else if (!isApprover && contract.regularInactivityDays !== undefined) {
        return contract.regularInactivityDays;
    }

    if (contract.inactivityNotificationDays !== undefined) {
        return contract.inactivityNotificationDays;
    }

    if (isApprover || status.includes("review") || status.includes("approval") || status.includes("send_back") || status.includes("declined")) {
        return 3;
    }

    return 1;
};