import type {ComponentProps} from "react";
import * as Primitive from "@radix-ui/react-alert-dialog";
import {Button} from "./button";
import {cn} from "@/lib/utils";
export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;
export function AlertDialogContent({className, ...props}: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Portal><Primitive.Overlay className="ui-dialog-overlay"/><Primitive.Content className={cn("ui-dialog-content", className)} {...props}/></Primitive.Portal>;
}
export function AlertDialogTitle({className, ...props}: ComponentProps<typeof Primitive.Title>) {return <Primitive.Title className={cn("ui-dialog-title", className)} {...props}/>}
export function AlertDialogDescription({className, ...props}: ComponentProps<typeof Primitive.Description>) {return <Primitive.Description className={cn("ui-dialog-description", className)} {...props}/>}
export function AlertDialogCancel(props: ComponentProps<typeof Primitive.Cancel>) {return <Button variant="outline" asChild><Primitive.Cancel {...props}/></Button>}
export function AlertDialogAction(props: ComponentProps<typeof Primitive.Action>) {return <Button variant="destructive" asChild><Primitive.Action {...props}/></Button>}
export function AlertDialogFooter({className, ...props}: ComponentProps<"div">) {return <div className={cn("ui-dialog-footer", className)} {...props}/>}
