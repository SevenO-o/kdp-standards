import type {ComponentProps} from "react";
import * as Primitive from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import {cn} from "@/lib/utils";
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export function DialogContent({className, children, ...props}: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Overlay className="ui-dialog-overlay"/><Primitive.Content className={cn("ui-dialog-content", className)} {...props}>{children}<Primitive.Close className="ui-dialog-close" aria-label="关闭弹窗"><X size={18}/></Primitive.Close></Primitive.Content></Primitive.Portal>;
}
export function DialogTitle({className, ...props}: ComponentProps<typeof Primitive.Title>) {return <Primitive.Title className={cn("ui-dialog-title", className)} {...props}/>}
export function DialogDescription({className, ...props}: ComponentProps<typeof Primitive.Description>) {return <Primitive.Description className={cn("ui-dialog-description", className)} {...props}/>}
export function DialogHeader({className, ...props}: ComponentProps<"div">) {return <div className={cn("mb-5", className)} {...props}/>}
export function DialogFooter({className, ...props}: ComponentProps<"div">) {return <div className={cn("ui-dialog-footer", className)} {...props}/>}
