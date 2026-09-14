import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cva, type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";
const buttonVariants = cva("ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
      outline: "border border-input bg-card text-card-foreground hover:bg-muted active:bg-muted/80",
      ghost: "text-foreground hover:bg-muted active:bg-muted/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
    },
    size: {default: "h-10 px-4 py-2", sm: "h-10 px-3", icon: "h-10 w-10 p-0"},
  }, defaultVariants: {variant: "default", size: "default"},
});
export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {asChild?: boolean}
export function Button({className, variant, size, asChild = false, ...props}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({variant, size, className}))} {...props}/>;
}
