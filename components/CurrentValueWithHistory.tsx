import { isToday, parseISO } from "date-fns";
import React, { useContext } from "react";
import { formatNumber } from "../helpers/formatters";
import Widget from "./Widget";

const TimelineWidgetContext = React.createContext<{
  data: any[];
  subset: any[];
  dataKey: string;
  unit: string;
}>({
  data: [],
  subset: [],
  dataKey: "",
  unit: "",
});

export default function TimelineWidget({
  data,
  children,
  days,
  dataKey,
  className = "",
  unit = "",
}) {
  const subset = data.slice().reverse().slice(0, days).reverse();

  return (
    <TimelineWidgetContext.Provider value={{ data, subset, dataKey, unit }}>
      <Widget className={className}>{children}</Widget>
    </TimelineWidgetContext.Provider>
  );
}

TimelineWidget.BarChart = ({ color }) => {
  const { dataKey, subset, unit } = useContext(TimelineWidgetContext);
  return (
    <Widget.BarChart
      className="w-full lg:w-1/2 xl:w-3/5"
      data={subset}
      dataKey={dataKey}
      color={color}
      unit={unit}
    />
  );
};

TimelineWidget.LineChart = ({ color }) => {
  const { dataKey, subset, unit } = useContext(TimelineWidgetContext);
  return (
    <Widget.LineChart
      className="w-full lg:w-1/2 xl:w-3/5"
      data={subset}
      dataKey={dataKey}
      color={color}
      unit={unit}
    />
  );
};

TimelineWidget.Value = ({
  showDelta = false,
  children = 0,
  precision = undefined,
  calculateDelta = false,
  label,
}: {
  showDelta?: boolean;
  calculateDelta?: boolean;
  children: number;
  label: React.ReactNode;
  precision?: number;
}) => {
  const { unit, subset, dataKey } = useContext(TimelineWidgetContext);
  const lastValueIsToday = isToday(parseISO(subset[subset.length - 1].day));
  const prevValue = lastValueIsToday
    ? subset[subset.length - 2][dataKey]
    : subset[subset.length - 1][dataKey];
  const diffBasis = lastValueIsToday
    ? subset[subset.length - 1][dataKey]
    : children;
  const currentValue = subset[subset.length - 1][dataKey];
  const delta = calculateDelta ? diffBasis - prevValue : currentValue;
  return (
    <Widget.Value
      className="lg:w-1/2 xl:w-2/5"
      delta={showDelta ? delta : undefined}
      label={label}
    >
      {formatNumber(children, precision)}
      {unit}
    </Widget.Value>
  );
};
