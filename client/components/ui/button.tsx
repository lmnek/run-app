import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable } from 'react-native';
import { TextClassContext } from 'components/ui/text';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'group flex items-center justify-center rounded-md',
    {
        variants: {
            variant: {
                default: 'bg-primary active:opacity-90',
                destructive: 'bg-destructive active:opacity-90',
                outline: 'border border-input bg-background active:bg-accent',
                secondary: 'bg-secondary active:opacity-80',
                ghost: 'active:bg-accent',
                link: '',
            },
            size: {
                default: 'h-10 px-4 py-2 native:h-12 native:px-5 native:py-3 shadow',
                sm: 'h-9 rounded-md px-3 shadow',
                lg: 'h-11 rounded-md px-8 native:h-14 shadow',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const buttonTextVariants = cva(
    'web:whitespace-nowrap text-sm native:text-base text-foreground web:transition-colors',
    {
        variants: {
            variant: {
                default: 'text-white',
                destructive: 'text-destructive-foreground',
                outline: 'group-active:text-accent-foreground',
                secondary: 'text-secondary-foreground group-active:text-secondary-foreground',
                ghost: 'group-active:text-accent-foreground',
                link: 'text-primary group-active:underline',
            },
            size: {
                default: '',
                sm: '',
                lg: 'native:text-lg',
                icon: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
    VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <TextClassContext.Provider
                value={cn(
                    props.disabled && 'web:pointer-events-none',
                    buttonTextVariants({ variant, size })
                )}
            >
                <Pressable
                    className={cn(
                        props.disabled && 'opacity-50 web:pointer-events-none',
                        buttonVariants({ variant, size, className })
                    )}
                    ref={ref}
                    role='button'
                    {...props}
                />
            </TextClassContext.Provider>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
