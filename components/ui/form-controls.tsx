import React from "react";

// ==================== FORM FIELD WRAPPER ====================
interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string | string[] | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  name,
  required,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  const errorMsg = Array.isArray(error) ? error[0] : error;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      {children}

      {hint && !errorMsg && <p className="text-xs text-slate-500">{hint}</p>}

      {errorMsg && (
        <p id={`${name}-error`} role="alert" className="text-xs font-medium text-rose-600 animate-in fade-in duration-150">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

// ==================== TEXT INPUT ====================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors ${
          hasError
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// ==================== TEXTAREA ====================
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className = "", rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors ${
          hasError
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// ==================== SELECT ====================
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  options?: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, options, children, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors ${
          hasError
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
        } ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);
Select.displayName = "Select";

// ==================== CHECKBOX ====================
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className = "", ...props }, ref) => {
    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            {...props}
          />
        </div>
        <div className="text-sm">
          <label htmlFor={id} className="font-medium text-slate-700 cursor-pointer">
            {label}
          </label>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
