"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva("", {
  variants: {
    variant: {
      gold: "btn btn-primary",
      ghost: "btn btn-ghost",
      outline: "btn btn-accent-outline",
      danger: "btn",
    },
    size: {
      sm: "text-sm",
      md: "",
      lg: "",
      xl: "",
    },
  },
  defaultVariants: { variant: "gold", size: "md" },
});

const sizePad: Record<NonNullable<VariantProps<typeof buttonVariants>["size"]>, string> = {
  sm: "px-3 py-2 text-xs",
  md: "",
  lg: "px-7 py-3.5 text-base",
  xl: "px-9 py-4 text-lg",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const extra = size ? sizePad[size] : "";
    return (
      <Comp
        className={cn(buttonVariants({ variant }), extra, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
