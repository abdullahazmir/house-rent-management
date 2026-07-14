import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-secondary">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-primary' : 'border-secondary/30'
        } ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-brown">{error}</p> : null}
    </div>
  );
});
