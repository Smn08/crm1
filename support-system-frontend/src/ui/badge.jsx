import React from "react";

export function Badge({ children, className = "", ...props }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}