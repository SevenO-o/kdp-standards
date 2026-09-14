import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";
export function Input({className, ...props}: ComponentProps<"input">) {
  return <input data-slot="input" className={cn("ui-field h-10 w-full rounded-md border border-input bg-input-surface px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60", className)} {...props}/>;
}
