import { parseISO } from "date-fns";
import { format } from "date-fns-tz";
import { de as locale } from "date-fns/locale";
import { FormattedMessage } from "react-intl";
import { COLORS, TIME_ZONE as timeZone } from "../helpers/constants";
import Number from "./Number";
import Widget from "./Widget";

export default function NewCases({ allCases, timeline, versionData, days }) {
  const lastEntry = timeline[timeline.length - 1];
  const versionDate = parseISO(versionData.versionDate);
  let newCasesSinceUpdate = allCases - lastEntry.casesSum;

  const reversedTimeline = timeline.slice().reverse();
  let data = reversedTimeline.slice(0, days).reverse();

  return (
    <Widget className="bg-blue-100 text-blue-900">
      <div className="lg:w-1/2 xl:w-2/5">
        <Widget.Value
          label={
            <>
              <FormattedMessage
                tagName="div"
                id="dashboard.cases.new_cases_since"
                defaultMessage="Neue Fälle seit {x}"
                values={{
                  x: format(versionDate, "dd.MM. HH:mm", {
                    locale,
                    timeZone,
                  }),
                }}
              />
              <div>
                (
                <FormattedMessage
                  id="dashboard.cases.last_ages_update"
                  defaultMessage="Letztes AGES-Update"
                />
                )
              </div>
            </>
          }
        >
          <Number>{newCasesSinceUpdate}</Number>
        </Widget.Value>
      </div>
      <Widget.BarChart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={[
          ...data.slice(0, -1),
          { ...data.slice().pop(), className: "opacity-50" },
        ]}
        dataKey="cases"
        color={COLORS.blue.dark}
      />
    </Widget>
  );
}
