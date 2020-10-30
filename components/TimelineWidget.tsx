import { isToday, parseISO } from "date-fns";
import React, { useContext } from "react";
import Number from "./Number";
import Widget from "./Widget";

interface TimelineWidgetContext<T> {
  data: T[];
  subset: T[];
  dataKey: keyof T & string;
  unit?: string;
}
const TimelineWidgetContext = React.createContext<TimelineWidgetContext<any>>({
  data: [],
  subset: [],
  dataKey: "",
});

function TimelineWidgetContextProvider<T>({
  value,
  children,
}: {
  value: TimelineWidgetContext<T>;
  children: React.ReactNode;
}) {
  return (
    <TimelineWidgetContext.Provider value={value}>
      {children}
    </TimelineWidgetContext.Provider>
  );
}

interface DateRow {
  day: string;
  [k: string]: unknown;
}

type TimelineWidgetProps<Row extends DateRow> = {
  dataKey: keyof Row & string;
  data: Row[];
  unit?: string;
  className?: string;
  days: number;
  children: React.ReactNode;
};

export default function TimelineWidget<Row extends DateRow>({
  data,
  children,
  days,
  dataKey,
  className,
  unit,
}: TimelineWidgetProps<Row>) {
  const subset = data.slice().reverse().slice(0, days).reverse();

  return (
    <TimelineWidgetContextProvider value={{ data, subset, dataKey, unit }}>
      <Widget className={className}>{children}</Widget>
    </TimelineWidgetContextProvider>
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
      <Number precision={precision}>{children}</Number>
      {unit}
    </Widget.Value>
  );
};
