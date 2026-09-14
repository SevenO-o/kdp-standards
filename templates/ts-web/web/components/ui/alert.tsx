import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";
export function Alert({className, variant="info", ...props}: ComponentProps<"div"> & {variant?: "info"|"success"|"warning"|"error"}) {return <div role={variant==="error"?"alert":"status"} className={cn("ui-alert", `ui-alert-${variant}`, className)} {...props}/>}
export function AlertTitle({className, ...props}: ComponentProps<"h3">) {return <h3 className={cn("m-0 text-sm font-medium", className)} {...props}/>}
export function AlertDescription({className, ...props}: ComponentProps<"div">) {return <div className={cn("mt-1 text-sm text-muted-foreground", className)} {...props}/>}
