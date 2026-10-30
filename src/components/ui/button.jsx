import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-brand-gold to-brand-amber text-brand-navy hover:from-brand-amber hover:to-brand-gold-dark shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-brand-navy hover:from-brand-cyan-dark hover:to-brand-cyan shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-brand-cyan/50 bg-transparent text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan",
        ghost:
          "bg-transparent text-brand-silver hover:bg-brand-slate/50 hover:text-white",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-lg",
        goldOutline:
          "border-2 border-brand-gold/50 bg-transparent text-brand-gold hover:bg-brand-gold/10 hover:border-brand-gold",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
