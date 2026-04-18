/**
 * @file card.tsx
 * @description Reusable Card component with header, body, and footer sections.
 * Supports glass and gradient variants for premium visual effects.
 */

/* Local imports */
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════ */
/* TYPE DEFINITIONS                                                */
/* ═══════════════════════════════════════════════════════════════ */

/* Card visual variant options */
type CardVariant = "default" | "glass" | "gradient" | "bordered";

/* Props for the Card container */
interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

/* Props for the Card Header section */
interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

/* Props for the Card Body section */
interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

/* Props for the Card Footer section */
interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

/* ═══════════════════════════════════════════════════════════════ */
/* VARIANT STYLES                                                  */
/* ═══════════════════════════════════════════════════════════════ */

/* Maps card variants to their Tailwind class strings */
const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-white border border-gray-200/60",
  glass: "glass",
  gradient: "gradient-card border border-gray-200/60",
  bordered: "bg-white border-2 border-gray-200",
};

/* ═══════════════════════════════════════════════════════════════ */
/* COMPONENTS                                                      */
/* ═══════════════════════════════════════════════════════════════ */

/**
 * Card — Container component with optional glass/gradient effects.
 * Composes with CardHeader, CardBody, and CardFooter for structure.
 */
const Card = ({
  variant = "default",
  className,
  children,
  onClick,
  hoverable = false,
}: CardProps) => {
  return (
    <div
      /* Attach click handler if provided */
      onClick={onClick}
      /* Add cursor-pointer if the card is clickable */
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        /* Base styles — rounded, shadow, transition */
        "rounded-xl shadow-sm overflow-hidden",
        "transition-all duration-200",
        /* Hover effect — subtle lift when card is interactive */
        hoverable && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        onClick && "cursor-pointer",
        /* Apply variant-specific styles */
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader — Top section of a Card, typically contains title and actions.
 */
const CardHeader = ({ className, children }: CardHeaderProps) => {
  return (
    <div
      className={cn(
        /* Header styles — padding, bottom border */
        "px-6 py-4 border-b border-gray-100",
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * CardBody — Main content area of a Card.
 */
const CardBody = ({ className, children }: CardBodyProps) => {
  return (
    <div className={cn("px-6 py-4", className)}>
      {children}
    </div>
  );
};

/**
 * CardFooter — Bottom section of a Card, typically contains actions.
 */
const CardFooter = ({ className, children }: CardFooterProps) => {
  return (
    <div
      className={cn(
        /* Footer styles — padding, top border, right-aligned */
        "px-6 py-3 border-t border-gray-100 bg-gray-50/50",
        "flex items-center justify-end gap-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardBody, CardFooter };
export type { CardProps, CardVariant };
