import { ComponentProps } from 'react'
export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`card ${className}`} {...props} />
}
