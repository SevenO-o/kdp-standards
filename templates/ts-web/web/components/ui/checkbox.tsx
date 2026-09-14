import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";
export function Checkbox({className,...props}: Omit<ComponentProps<"input">,"type">) {return <input type="checkbox" className={cn("ui-checkbox",className)} {...props}/>}
