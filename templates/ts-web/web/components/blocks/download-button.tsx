import {Download} from "lucide-react";
import {Button} from "@/components/ui/button";
export function DownloadButton({href, filename, disabled=false, onRequest, label="下载结果"}: {href?:string;filename:string;disabled?:boolean;onRequest?:()=>void;label?:string}) {
  if(disabled||!href)return <Button disabled><Download aria-hidden="true"/>{label}</Button>;
  return <Button asChild><a href={href} download={filename} onClick={onRequest}><Download aria-hidden="true"/>{label}</a></Button>;
}
