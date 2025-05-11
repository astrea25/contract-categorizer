import { Button } from "@/components/ui/button";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { toast as sonnerToast } from "sonner";
import { useToast } from "@/hooks/use-toast";

export function ToastExample() {
    const {
        toast
    } = useCustomToast();

    const {
        toast: uiToast,
        dismiss
    } = useToast();

    const showDefaultToast = () => {
        toast({
            title: "Default Toast",
            description: "This is a default toast with dismiss button"
        });
    };

    const showCustomDurationToast = () => {
        toast({
            title: "Custom Duration",
            description: "This toast will disappear in 10 seconds",
            duration: 10000
        });
    };

    const showPositionedToast = () => {
        toast({
            title: "Custom Position",
            description: "This toast appears at the bottom left",
            position: "bottom-left"
        });
    };

    const showDestructiveToast = () => {
        toast({
            title: "Error Toast",
            description: "Something went wrong!",
            variant: "destructive"
        });
    };

    const showMultipleToasts = () => {
        for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
                uiToast({
                    title: `Toast ${i}`,
                    description: `This is toast number ${i}`
                });
            }, i * 100);
        }
    };

    const dismissAllToasts = () => {
        dismiss();
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-xl font-bold">Toast Examples</h2>
            <div className="flex flex-wrap gap-2">
                <Button onClick={showDefaultToast}>Show Default Toast</Button>
                <Button onClick={showCustomDurationToast}>Custom Duration (10s)</Button>
                <Button onClick={showPositionedToast}>Custom Position</Button>
                <Button onClick={showDestructiveToast} variant="destructive">Error Toast
                                                                    </Button>
                <Button onClick={showMultipleToasts} variant="outline">Show Multiple Toasts
                                                                    </Button>
                <Button onClick={dismissAllToasts} variant="secondary">Dismiss All
                                                                    </Button>
            </div>
        </div>
    );
}