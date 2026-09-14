import type {ComponentProps} from "react";
import * as Primitive from "@radix-ui/react-select";
import {Check, ChevronDown, ChevronUp} from "lucide-react";
import {cn} from "@/lib/utils";
export const Select = Primitive.Root;
export const SelectValue = Primitive.Value;
export const SelectGroup = Primitive.Group;
export function SelectTrigger({className, children, ...props}: ComponentProps<typeof Primitive.Trigger>) {
  return <Primitive.Trigger data-slot="select-trigger" className={cn("ui-select-trigger ui-field", className)} {...props}>{children}<Primitive.Icon asChild><ChevronDown size={16} aria-hidden="true"/></Primitive.Icon></Primitive.Trigger>;
}
export function SelectContent({className, children, position = "popper", sideOffset = 6, ...props}: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Content position={position} sideOffset={sideOffset} collisionPadding={12} className={cn("ui-select-content", className)} {...props}>
    <Primitive.ScrollUpButton className="ui-select-scroll"><ChevronUp size={14}/></Primitive.ScrollUpButton>
    <Primitive.Viewport className="ui-select-viewport">{children}</Primitive.Viewport>
    <Primitive.ScrollDownButton className="ui-select-scroll"><ChevronDown size={14}/></Primitive.ScrollDownButton>
  </Primitive.Content></Primitive.Portal>;
}
export function SelectItem({className, children, ...props}: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className={cn("ui-select-item", className)} {...props}><Primitive.ItemText>{children}</Primitive.ItemText><Primitive.ItemIndicator className="ui-select-check"><Check size={16}/></Primitive.ItemIndicator></Primitive.Item>;
}
export function SelectLabel({className, ...props}: ComponentProps<typeof Primitive.Label>) {return <Primitive.Label className={cn("px-3 py-2 text-xs text-muted-foreground", className)} {...props}/>}
export function SelectSeparator({className, ...props}: ComponentProps<typeof Primitive.Separator>) {return <Primitive.Separator className={cn("my-1 h-px bg-border", className)} {...props}/>}
