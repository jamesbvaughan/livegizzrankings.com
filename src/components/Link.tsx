import type { LinkProps } from "next/link";
// oxlint-disable-next-line no-restricted-imports -- This is the wrapper.
import NextLink from "next/link";

import { LinkPendingIndicator } from "./LinkPendingIndicator";

/**
 * `next/link`'s `Link`, plus a progress bar while its navigation is pending.
 *
 * Use this instead of importing `next/link` directly.
 */
export function Link<RouteType>({ children, ...props }: LinkProps<RouteType>) {
  return (
    <NextLink {...props}>
      {children}
      <LinkPendingIndicator />
    </NextLink>
  );
}
