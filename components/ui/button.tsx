"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
  {
    variants: {
      variant: {
        gold:
          "bg-gold-gradient text-bg-deep font-semibold shadow-gold hover:scale-[1.02] active:scale-[0.98]",
        ghost:
          "bg-white/[0.04] border border-white/10 text-white/90 hover:bg-white/[0.08] hover:border-white/20",
        outline:
          "border border-gold/30 text-gold hover:bg-gold/10",
        danger:
          "bg-danger/90 text-white hover:bg-danger",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-5 py-3 text-base",
        lg: "px-7 py-4 text-lg",
        xl: "px-9 py-5 text-xl",
      },
    },
    defaultVariants: { variant: "gold", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
