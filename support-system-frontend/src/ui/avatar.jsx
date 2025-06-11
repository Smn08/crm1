import React from "react";

export function Avatar({ src, alt = "", className = "", ...props }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${className}`}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-500 dark:text-gray-300 text-lg font-semibold">
          {alt ? alt[0].toUpperCase() : "?"}
        </span>
      )}
    </span>
  );
}

export function AvatarFallback({ children, className = "", ...props }) {
  return (
    <span
      className={`flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-300 text-lg font-semibold ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}