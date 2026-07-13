import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-400',
  secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
