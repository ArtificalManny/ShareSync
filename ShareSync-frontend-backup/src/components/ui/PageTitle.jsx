import React from "react";
import { cn } from "./cn";

export default function PageTitle({ className = "", children }) {
    return <h1 className={cn("title-page", className)}>{children}</h1>;
}