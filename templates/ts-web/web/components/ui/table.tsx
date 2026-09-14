import type {ComponentProps} from "react";
import {cn} from "@/lib/utils";
export function Table({className, ...props}: ComponentProps<"table">) {return <div className="ui-table-scroll"><table className={cn("ui-table", className)} {...props}/></div>}
export function TableHeader(props: ComponentProps<"thead">) {return <thead {...props}/>}
export function TableBody(props: ComponentProps<"tbody">) {return <tbody {...props}/>}
export function TableRow(props: ComponentProps<"tr">) {return <tr {...props}/>}
export function TableHead(props: ComponentProps<"th">) {return <th scope="col" {...props}/>}
export function TableCell(props: ComponentProps<"td">) {return <td {...props}/>}
export function TableCaption({className, ...props}: ComponentProps<"caption">) {return <caption className={cn("text-left text-xs text-muted-foreground", className)} {...props}/>}
