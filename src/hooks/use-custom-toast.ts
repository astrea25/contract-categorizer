/**
 * Custom hook that provides a unified toast interface with additional options
 * 
 * @returns Object with toast function
 */
/**
   * Show a toast notification with customizable options
   * 
   * @param options Toast configuration options
   */
// Use sonner toast for more advanced options
// Use UI toast for simpler cases
import { toast as sonnerToast } from "sonner";
import { toast as uiToast } from "./use-toast";

type ToastOptions = {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
    duration?: number;
    action?: React.ReactNode;
    dismissible?: boolean;
    position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
};

export function useCustomToast() {
    const toast = (options: ToastOptions) => {
        const {
            title,
            description,
            variant = "default",
            duration = 5000,
            action,
            dismissible = true,
            position
        } = options;

        if (position || duration !== 5000) {
            return sonnerToast(title, {
                description,
                duration,
                position: position as any,
                dismissible,
                action
            });
        }

        return uiToast({
            title,
            description,
            variant: variant as any,
            action
        });
    };

    return {
        toast
    };
}