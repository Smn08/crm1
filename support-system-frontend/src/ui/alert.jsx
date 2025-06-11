import React from "react";

export function Alert({ children, variant = "default", className = "", ...props }) {
  const base =
    "rounded-md p-4 mb-4 border text-sm " +
    (variant === "destructive"
      ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-100"
      : "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100");
  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}