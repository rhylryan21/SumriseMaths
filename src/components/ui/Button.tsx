import { ComponentProps } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'

type ButtonProps = ComponentProps<'button'> & {
  /** Visual style variant; defaults to 'primary' */
  variant?: ButtonVariant
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  link: 'btn-link',
}

export function Button({ className = '', variant = 'primary', ...rest }: ButtonProps) {
  const variantClass = VARIANT_CLASS[variant] ?? ''
  return <button className={`btn ${variantClass} ${className}`} {...rest} />
}

/** Backwards-compatible alias */
export function PrimaryButton({ className = '', ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" className={className} {...props} />
}
