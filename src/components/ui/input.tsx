'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const inputId = id || React.useId()
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mid-gray">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={inputType}
            className={cn(
              'input-field',
              leftIcon && 'pl-11',
              (rightIcon || isPassword) && 'pr-11',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/30',
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mid-gray hover:text-graphite transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mid-gray">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="input-error">{error}</p>}
        {!error && hint && (
          <p className="text-caption text-mid-gray mt-1">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }

