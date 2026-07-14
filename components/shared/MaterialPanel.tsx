import type { HTMLAttributes } from "react";

export function MaterialPanel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glass-material ${className}`.trim()} {...props} />;
}
