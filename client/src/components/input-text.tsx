'use client';

import { forwardRef } from 'react';
import type { FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';

interface InputTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl>;
}

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const messages: string[] = [];
    if (error) {
      if (error.message) messages.push(error.message as string);
      if (error.types) {
        Object.values(error.types).forEach((v) => {
          if (Array.isArray(v)) {
            v.forEach((m) => { if (m && !messages.includes(m)) messages.push(m); });
          } else if (typeof v === 'string' && !messages.includes(v)) {
            messages.push(v);
          }
        });
      }
    }

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={`w-full bg-background border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            messages.length > 0 ? 'border-danger' : 'border-border'
          } ${className ?? ''}`}
          {...props}
        />
        {messages.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {messages.map((msg) => (
              <li key={msg} className="text-danger text-xs">
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

InputText.displayName = 'InputText';
