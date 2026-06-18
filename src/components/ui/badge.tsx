import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import React from 'react';

import { cn } from '@helpers';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-primary focus-visible:primary-[3px] focus-visible:primary-primary/50 aria-invalid:border-destructive aria-invalid:primary-destructive/20 dark:aria-invalid:primary-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white focus-visible:primary-destructive/20 dark:bg-destructive/60 dark:focus-visible:primary-destructive/40 [a&]:hover:bg-destructive/90',
        outline: 'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        outlineActive: 'border-active text-active',
        outlineTertiary: 'border-tertiary text-tertiary',
        outlineNeutral: 'border-neutral-400 text-neutral-400',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
      size: {
        small: 'text-[0.6rem]',
        regular: 'text-[0.8rem]',
        large: 'text-[1rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'regular',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  size = 'regular',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot='badge'
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
