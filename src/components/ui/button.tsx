import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import React from 'react';

import { cn } from '@helpers';

const buttonVariants = cva(
  // eslint-disable-next-line quotes
  "inline-flex transition cursor-pointer shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-primary focus-visible:primary-[3px] focus-visible:primary-primary/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:primary-destructive/20 dark:aria-invalid:primary-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-400',
        destructive:
          'bg-alert text-white hover:bg-alert/90 focus-visible:primary-alert/20 dark:bg-alert/60 dark:focus-visible:primary-alert/40',
        outline:
          'border shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-accent dark:bg-accent/30 dark:hover:bg-accent/50',
        outlinePrimary: 'text-primary border border-primary shadow-xs hover:bg-primary-50',
        outlineTertiary: 'text-tertiary border border-tertiary shadow-xs hover:bg-tertiary-50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-600',
        tertiary: 'bg-tertiary text-tertiary-foreground hover:bg-tertiary-600',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        ghostPrimary: 'hover:bg-primary text-primary hover:bg-primary-50 dark:hover:bg-primary/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        // eslint-disable-next-line quotes
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        // eslint-disable-next-line quotes
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
