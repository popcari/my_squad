import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  keepOpen?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className = '', children, value, defaultValue, onChange, disabled, keepOpen, ...props },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Controlled prop is read via `currentValue` below; no need to mirror it
    // into internal state (which would violate react-hooks/set-state-in-effect).

    // Parse options
    const options = React.Children.toArray(children)
      .map((child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          const element = child as React.ReactElement<{
            value: string | number;
            children: React.ReactNode;
            disabled?: boolean;
          }>;
          return {
            value: element.props.value,
            label: element.props.children,
            disabled: element.props.disabled,
          };
        }
        return null;
      })
      .filter(Boolean) as {
      value: string | number;
      label: React.ReactNode;
      disabled?: boolean;
    }[];

    const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

    const updateDropdownPosition = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownStyle((prev) => {
          if (
            prev.top === rect.bottom + 4 &&
            prev.left === rect.left &&
            prev.width === rect.width
          ) {
            return prev; // No change — skip re-render
          }
          return { top: rect.bottom + 4, left: rect.left, width: rect.width };
        });
      }
    };

    // Keep position synced while open (handles scroll/resize with keepOpen)
    useEffect(() => {
      if (!isOpen) return;
      updateDropdownPosition();
    }, [isOpen]);

    const toggleOpen = () => {
      if (disabled) return;
      if (!isOpen) {
        updateDropdownPosition();
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      if (!isOpen) return;

      function handleClickOutside(event: MouseEvent) {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node)
        ) {
          const target = event.target as HTMLElement;
          if (!target?.closest?.('.select-dropdown-menu')) {
            setIsOpen(false);
          }
        }
      }

      function handleScroll(event: Event) {
        const target = event.target as HTMLElement;
        if (target?.closest?.('.select-dropdown-menu')) {
          return;
        }
        setIsOpen(false);
      }

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', () => setIsOpen(false));

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', () => setIsOpen(false));
      };
    }, [isOpen]);

    const currentValue = value !== undefined ? value : internalValue;
    const selectedOption =
      options.find((o) => String(o.value) === String(currentValue)) ||
      options[0];

    const handleSelect = (v: string | number) => {
      if (onChange) {
        onChange({
          target: { value: String(v), name: props.name },
          currentTarget: { value: String(v), name: props.name },
        } as React.ChangeEvent<HTMLSelectElement>);
      }
      if (value === undefined) {
        setInternalValue(v);
      }
      if (!keepOpen) {
        setIsOpen(false);
      }
    };

    return (
      <div
        className={`relative inline-block w-full text-left group ${className}`}
        ref={wrapperRef}
      >
        {/* Trigger */}
        <div
          tabIndex={disabled ? -1 : 0}
          className={`flex items-center justify-between w-full h-full min-h-[38px] appearance-none bg-background border border-border group-hover:border-primary/50 group-hover:bg-card-hover rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } text-foreground ${
            isOpen ? 'ring-2 ring-primary border-transparent' : ''
          }`}
          onClick={toggleOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleOpen();
            }
          }}
        >
          <span className="truncate">{selectedOption?.label}</span>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted group-hover:text-primary transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-500 ${
                isOpen ? '-rotate-180 text-primary' : 'group-focus-within:-rotate-180'
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Dropdown Menu Portal */}
        {isOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <ul
              style={{
                position: 'fixed',
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
              }}
              className="select-dropdown-menu z-[9999] bg-card border border-border rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden max-h-60 overflow-y-auto outline-none py-1 animate-in fade-in zoom-in-95 duration-200"
            >
              {options.map((option, idx) => {
                const isSelected = String(option.value) === String(currentValue);
                return (
                  <li
                    key={idx}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/20 text-primary font-medium border-l-[3px] border-primary'
                        : 'hover:bg-card-hover text-foreground border-l-[3px] border-transparent'
                    } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!option.disabled) {
                        handleSelect(option.value);
                      }
                    }}
                  >
                    {option.label}
                  </li>
                );
              })}
            </ul>,
            document.body
          )}

        {/* Hidden native select for standard compatibility */}
        <select
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          className="hidden"
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
