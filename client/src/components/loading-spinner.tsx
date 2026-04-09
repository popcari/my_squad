interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label for screen readers */
  label?: string;
  /** Render a full-page centered overlay */
  fullPage?: boolean;
}

/**
 * Accessible animated loading spinner.
 * Uses CSS classes (spinner-sm / spinner-md / spinner-lg) defined in globals.css.
 */
export function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeClass =
    size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : 'spinner-md';

  const spinner = (
    <div role="status" aria-label={label}>
      <div className={`spinner ${sizeClass}`} />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullPage) {
    return <div className="spinner-fullpage">{spinner}</div>;
  }

  return spinner;
}
