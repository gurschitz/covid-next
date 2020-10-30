import Link from "next/link";
import { FormattedMessage } from "react-intl";

export default function Footer() {
  return (
    <div className="space-y-8 pb-10 pt-8">
      <div className="text-center text-lg space-x-2 text-gray-600 ">
        <Link href="/" locale="de">
          <a className="hover:text-gray-500 transition-all duration-150 ease-in-out">
            de
          </a>
        </Link>
        <span>|</span>
        <Link href="/" locale="en">
          <a className="hover:text-gray-500 transition-all duration-150 ease-in-out">
            en
          </a>
        </Link>
      </div>
      <div className="text-center text-xs text-gray-600 space-x-2">
        <FormattedMessage
          id="footer.source"
          defaultMessage="Daten von <a>Ages Dashboard CSV-Download</a>"
          values={{
            a: (chunks) => (
              <a
                className="text-blue-500"
                href="https://covid19-dashboard.ages.at/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
          }}
        />
        <span>|</span>
        <Link href="/imprint">
          <a className="text-blue-500">
            <FormattedMessage id="common.imprint" defaultMessage="Impressum" />
          </a>
        </Link>
      </div>
    </div>
  );
}
