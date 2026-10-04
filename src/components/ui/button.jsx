import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils.js";

const buttonVariants = cva(
  // Цвета — токены приложения из src/index.css, состояния — производные
  // токены оттуда же. Нажатие меняет и цвет (accent-press), и геометрию:
  // одна усадка на 2 % на тёмной теме не видна.
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]",
        destructive:
          "bg-[var(--danger)] text-[var(--on-danger)] hover:opacity-90",
        outline:
          "border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--surface-hover)] active:bg-[var(--accent-soft)]",
        secondary:
          "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] active:bg-[var(--accent-soft)]",
        ghost:
          "text-[var(--ink)] hover:bg-[var(--surface-hover)] active:bg-[var(--accent-soft)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export const Button = forwardRef(
  /**
   * @param {{ className?: string, variant?: string, size?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
   * @param {React.Ref<HTMLButtonElement>} ref
   */
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants(/** @type {*} */ ({ variant, size })), className)}
        {...props}
      />
    );
  },
);

export { buttonVariants };
