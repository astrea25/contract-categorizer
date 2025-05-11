import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { X } from "lucide-react";
type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = (
    {
        ...props
    }: ToasterProps
) => {
    const {
        theme = "system"
    } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            closeButton
            duration={5000}
            richColors
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    closeButton: "group-[.toast]:bg-transparent group-[.toast]:border-none group-[.toast]:text-foreground/50 group-[.toast]:hover:text-foreground"
                }
            }}
            {...props} />
    );
};

export { Toaster };