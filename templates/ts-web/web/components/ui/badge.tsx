import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";
export function Badge({className, variant="neutral", ...props}: ComponentProps<"span"> & {variant?:"neutral"|"success"|"warning"|"error"}) {return <span className={cn("ui-badge", `ui-badge-${variant}`, className)} {...props}/>}
