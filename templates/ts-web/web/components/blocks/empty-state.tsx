import type {ReactNode} from "react";
export function EmptyState({title, description, icon, action}: {title:string;description:string;icon?:ReactNode;action?:ReactNode}) {
  return <div className="ui-empty-state">{icon&&<span aria-hidden="true">{icon}</span>}<h3>{title}</h3><p>{description}</p>{action}</div>;
}
