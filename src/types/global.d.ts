declare module 'react-hot-toast' {
  export interface ToastOptions {
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
    icon?: string | React.ReactNode;
    ariaProps?: {
      role: string;
      'aria-live': string;
    };
  }

  export interface Toast {
    id: string;
    type: 'success' | 'error' | 'loading' | 'blank' | 'custom';
    message: string;
    options?: ToastOptions;
  }

  export function toast(message: string, options?: ToastOptions): string;
  export function toast.success(message: string, options?: ToastOptions): string;
  export function toast.error(message: string, options?: ToastOptions): string;
  export function toast.loading(message: string, options?: ToastOptions): string;
  export function toast.custom(message: string, options?: ToastOptions): string;
  export function toast.dismiss(toastId?: string): void;
  export function toast.promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ): Promise<T>;
}

declare module 'react-confetti' {
  import { ComponentType } from 'react';

  export interface ConfettiProps {
    width?: number;
    height?: number;
    numberOfPieces?: number;
    recycle?: boolean;
    colors?: string[];
    gravity?: number;
    wind?: number;
    onConfettiComplete?: (confetti: any) => void;
    run?: boolean;
    tweenDuration?: number;
    initialVelocityX?: number;
    initialVelocityY?: number;
    friction?: number;
    rotationSpeed?: number;
    confettiSource?: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  }

  const Confetti: ComponentType<ConfettiProps>;
  export default Confetti;
}

declare module 'framer-motion' {
  import { ComponentType, ReactNode } from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    drag?: boolean;
    dragConstraints?: any;
    dragElastic?: number;
    dragMomentum?: boolean;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onHoverStart?: () => void;
    onHoverEnd?: () => void;
    onTapStart?: () => void;
    onTapEnd?: () => void;
    children?: ReactNode;
  }

  export function motion(component: string | ComponentType): ComponentType<MotionProps>;
  export const AnimatePresence: ComponentType<{ children: ReactNode }>;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export const Timer: ComponentType<IconProps>;
  export const Users: ComponentType<IconProps>;
  export const Crown: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
  export const Send: ComponentType<IconProps>;
} 