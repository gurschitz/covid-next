import { DATE_TIME_FORMAT } from "../helpers/constants";
import Nav from "./Nav";
import { FormattedMessage } from "react-intl";
import { useLocale } from "./IntlProvider";
import { parseAndFormatDate } from "../helpers/formatters";

export default function Header({ lastUpdated }: { lastUpdated?: string }) {
  const locale = useLocale();
  return (
    <div className="bg-blue-900">
      <div className="container space-y-2 lg:space-y-0 mx-auto p-2 lg:p-4 flex flex-col lg:flex-row items-center lg:justify-between ">
        <div>
          <h1 className="text-white text-xl text-center lg:text-2xl font-bold">
            <FormattedMessage
              id="header.title"
              defaultMessage="COVID-19 Österreich"
            />
          </h1>
          {lastUpdated && (
            <div className="text-gray-100 text-sm">
              <FormattedMessage
                id="header.last_updated"
                defaultMessage="Letztes Update: {lastUpdated}"
                values={{
                  lastUpdated: parseAndFormatDate(
                    lastUpdated,
                    DATE_TIME_FORMAT,
                    locale
                  ),
                }}
              />
            </div>
          )}
        </div>
        <Nav />
      </div>
    </div>
  );
}
