import { clsx } from "clsx";
import type { LinkProps } from "next/link";
import type { ComponentProps } from "react";

import { Link } from "./Link";

function StyledBoxedButton({ className, ...props }: ComponentProps<"div">) {
  return (
    <span
      {...props}
      className={clsx(
        "border-muted hover:border-foreground hover:text-foreground inline-block border-2 px-2 py-1 no-underline",
        className,
      )}
    />
  );
}

export function BoxedButtonLink<RouteType>({
  children,
  ...props
}: Exclude<LinkProps<RouteType>, "className">) {
  return (
    <Link {...props} className="no-underline">
      <StyledBoxedButton>{children}</StyledBoxedButton>
    </Link>
  );
}

export function BoxedButton({
  children,
  className,
  ...props
}: Exclude<ComponentProps<"button">, "className">) {
  return (
    <button
      {...props}
      className={clsx(
        "enabled:cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        props.type === "submit" && "group-invalid:pointer-events-none",
        className,
      )}
    >
      <StyledBoxedButton
        className={clsx(
          "disabled:border-muted",
          props.type === "submit" &&
            "group-invalid:hover:border-muted group-invalid:border-muted group-invalid:opacity-50 group-invalid:hover:text-current",
        )}
      >
        {children}
      </StyledBoxedButton>
    </button>
  );
}
