import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";
export function Textarea({className, ...props}: ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("ui-field flex min-h-24 w-full rounded-md border border-input bg-input-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60", className)} {...props}/>;
}
