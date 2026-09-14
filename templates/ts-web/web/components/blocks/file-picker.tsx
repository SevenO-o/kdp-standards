import {useId, useRef, useState} from "react";
import {Upload, FileText, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {validateFileSelection, type FileSelectionLimits} from "@/lib/file-selection";
export interface FilePickerProps extends FileSelectionLimits {
  files: readonly File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}
export function FilePicker({files, onFilesChange, maxBytes, maxFiles=1, extensions, disabled=false, label="选择文件"}: FilePickerProps) {
  const id=useId(), picker=useRef<HTMLInputElement>(null), choose=useRef<HTMLButtonElement>(null);
  const [error,setError]=useState(""),[dragging,setDragging]=useState(false);
  function accept(next: FileList|null) {
    setDragging(false);if(disabled||!next?.length)return;
    const selected=Array.from(next), message=validateFileSelection(selected,{maxBytes,maxFiles,extensions});
    if(message){setError(message);return}
    setError("");onFilesChange(selected);
  }
  return <div className="ui-file-picker">
    <div className="ui-file-drop" data-dragging={dragging&&!disabled} aria-disabled={disabled} onDragOver={event=>{event.preventDefault();if(!disabled)setDragging(true)}} onDragLeave={event=>{if(!(event.relatedTarget instanceof Node)||!event.currentTarget.contains(event.relatedTarget))setDragging(false)}} onDrop={event=>{event.preventDefault();accept(event.dataTransfer.files)}}>
      <Upload size={24} aria-hidden="true"/><strong>{label}</strong><p id={`${id}-help`}>支持 {extensions.join("、")}，每个文件最多 {maxBytes.toLocaleString()} 字节，一次最多 {maxFiles} 个。可拖放或重新选择。</p>
      <input id={id} ref={picker} type="file" hidden accept={extensions.join(",")} multiple={maxFiles>1} disabled={disabled} onChange={event=>{accept(event.target.files);event.target.value=""}}/>
      <Button ref={choose} type="button" variant="outline" disabled={disabled} aria-describedby={`${id}-help${error?` ${id}-error`:""}`} onClick={()=>picker.current?.click()}>{label}</Button>
    </div>
    {error&&<p id={`${id}-error`} role="alert" className="ui-file-error">{error}{files.length>0?" 已保留之前选择的文件。":""}</p>}
    {files.length>0&&<ul className="ui-file-list" aria-label="已选文件">{files.map((file,index)=><li key={`${file.name}-${index}`}><FileText size={18} aria-hidden="true"/><span><strong>{file.name}</strong><small>{file.size.toLocaleString()} 字节 · 已选择</small></span><Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`移除 ${file.name}`} onClick={()=>{onFilesChange(files.filter((_,i)=>i!==index));setError("");choose.current?.focus()}}><X aria-hidden="true"/></Button></li>)}</ul>}
  </div>;
}
