import { h } from './dom';

// All class lists live here, as constants. Never concatenate user data into them.
const BASE =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-4 text-base font-medium transition-colors duration-(--duration-micro) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';

const VARIANT = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-line bg-raised text-fg hover:bg-sunken',
} as const;

export interface ButtonProps {
  label: string;
  /** Read by the View's delegated click handler. */
  action: string;
  variant?: keyof typeof VARIANT;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  action,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps): HTMLButtonElement {
  const button = h('button', {
    type: 'button',
    class: `${BASE} ${VARIANT[variant]}`,
    'data-action': action,
    disabled: disabled || loading,
    'aria-busy': loading ? 'true' : undefined,
  });
  button.append(loading ? `${label}…` : label);
  return button;
}
