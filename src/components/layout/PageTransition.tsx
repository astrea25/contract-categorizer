import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type PageTransitionProps = {
    children: React.ReactNode;
    className?: string;
};

const PageTransition: React.FC<PageTransitionProps> = (
    {
        children,
        className
    }
) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState("animate-fade-in");

    useEffect(() => {
        if (location !== displayLocation) {
            setTransitionStage("animate-fade-out");
        }
    }, [location, displayLocation]);

    const handleAnimationEnd = () => {
        if (transitionStage === "animate-fade-out") {
            setTransitionStage("animate-fade-in");
            setDisplayLocation(location);
        }
    };

    return (
        <div
            className={cn(
                "min-h-screen w-full transition-opacity duration-300 ease-in-out",
                transitionStage,
                className
            )}
            onAnimationEnd={handleAnimationEnd}>
            {children}
        </div>
    );
};

export default PageTransition;