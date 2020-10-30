import Link from "next/link";
import { useRouter } from "next/router";
import classNames from "classnames";
import { FormattedMessage } from "react-intl";

type Props = {
  href: string;
  activeClassName?: string;
  inactiveClassName?: string;
  className?: string;
};

export const NavLink = ({
  href,
  children,
  activeClassName,
  inactiveClassName,
  className,
}: React.PropsWithChildren<Props>) => {
  const router = useRouter();

  return (
    <Link prefetch href={href}>
      <a
        className={classNames(
          router.pathname === href ? activeClassName : inactiveClassName,
          className
        )}
      >
        {children}
      </a>
    </Link>
  );
};

export default function Nav() {
  return (
    <nav className="flex justify-center py-4">
      <ul className="flex space-x-3">
        <li>
          <NavLink
            activeClassName="bg-blue-900 text-white"
            className="bg-gray-200 px-4 py-2 rounded focus:outline-none focus:shadow-outline"
            href="/"
          >
            <FormattedMessage
              id="common.dashboard"
              defaultMessage="Dashboard"
            />
          </NavLink>
        </li>
        <li>
          <NavLink
            activeClassName="bg-blue-900 text-white"
            className="bg-gray-200 px-4 py-2 rounded focus:outline-none focus:shadow-outline"
            href="/charts"
          >
            <FormattedMessage id="common.charts" defaultMessage="Charts" />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
