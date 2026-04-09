'use client';

import { forwardRef, useState } from 'react';
import type { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

interface InputTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl>;
}

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  ({ label, error, id, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const messages: string[] = [];
    if (error) {
      if (error.message) messages.push(error.message as string);
      if (error.types) {
        Object.values(error.types).forEach((v) => {
          if (Array.isArray(v)) {
            v.forEach((m) => {
              if (m && !messages.includes(m)) messages.push(m);
            });
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
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`w-full bg-background border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              isPassword ? 'pr-10' : ''
            } ${messages.length > 0 ? 'border-danger' : 'border-border'} ${className ?? ''}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {messages.map((msg) => (
              <li key={msg} className="text-danger text-[10px] md:text-xs">
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
