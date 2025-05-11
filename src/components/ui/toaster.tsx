import { useToast } from "@/hooks/use-toast";

import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
    ToastAction,
} from "@/components/ui/toast";

import { X } from "lucide-react";
import { Button } from "./button";

export function Toaster() {
    const {
        toasts,
        dismiss
    } = useToast();

    const dismissAll = () => {
        dismiss();
    };

    return (
        <ToastProvider>
            {toasts.length > 1 && (<div
                className="fixed bottom-4 right-4 z-[101] flex items-center gap-2 rounded-md bg-background border p-2 shadow-md md:max-w-[420px]">
                <span className="text-sm font-medium">
                    {toasts.length}notifications
                                                                      </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={dismissAll}
                    className="h-7 px-2 text-xs">Dismiss All
                                                                        <X className="ml-1 h-3 w-3" />
                </Button>
            </div>)}
            {toasts.map(function(
                {
                    id,
                    title,
                    description,
                    action,
                    ...props
                }
            ) {
                return (
                    <Toast key={id} {...props}>
                        <div className="grid gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && (<ToastDescription>{description}</ToastDescription>)}
                        </div>
                        {action}
                        <ToastClose />
                    </Toast>
                );
            })}
            <ToastViewport />
        </ToastProvider>
    );
}