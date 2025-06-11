import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`text-xl font-semibold ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-gray-500 dark:text-gray-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}