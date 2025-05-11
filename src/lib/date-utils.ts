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