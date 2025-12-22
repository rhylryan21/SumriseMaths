import { ComponentProps } from 'react'
export function Button({ className = '', ...props }: ComponentProps<'button'>) {
  return <button className={`btn ${className}`} {...props} />
}
export function PrimaryButton({ className = '', ...props }: ComponentProps<'button'>) {
  return <button className={`btn btn-primary ${className}`} {...props} />
}
