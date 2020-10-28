import { format } from "date-fns-tz";
import { DATE_TIME_FORMAT } from "../helpers/constants";
import { de as locale } from "date-fns/locale";
import Nav from "./Nav";
import { parseISO } from "date-fns";

export default function Header({ lastUpdated }: { lastUpdated?: string }) {
  return (
    <div className="p-4 flex flex-col lg:flex-row items-center lg:justify-between">
      <div>
        <h1 className="text-gray-700 text-3xl lg:text-4xl">
          COVID-19 Österreich
        </h1>
        {lastUpdated && (
          <div className="text-gray-600">
            Letztes Update:{" "}
            {format(parseISO(lastUpdated), DATE_TIME_FORMAT, {
              locale,
              timeZone: "Europe/Vienna",
            })}{" "}
          </div>
        )}
      </div>
      <Nav />
    </div>
  );
}
