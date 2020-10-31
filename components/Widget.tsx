import {
  Tooltip,
  Bar,
  ResponsiveContainer,
  BarChart,
  YAxis,
  Cell,
  DotProps,
  LineChart,
  Line,
} from "recharts";
import classNames from "classnames";
import { highlightedDayAtom } from "../atoms";
import { useAtom } from "jotai";
import { parseAndFormatDate } from "../helpers/formatters";
import { COLORS, DATE_FORMAT } from "../helpers/constants";
import { isSameDay, parseISO } from "date-fns";
import { getDay } from "date-fns";
import { intervalAtom } from "./IntervalButton";
import { useLocale } from "./IntlProvider";
import Number from "./Number";

export const CHART_MARGINS = { top: 10, bottom: 0, left: 5, right: 5 };
export const LINE_CHART_MARGINS = { top: 10, bottom: 0, left: 10, right: 10 };

function Widget({ children, className }) {
  return (
    <div
      className={classNames(
        "rounded-lg overflow-hidden flex flex-col lg:flex-row items-center justify-center relative text-center",
        className
      )}
    >
      {children}
    </div>
  );
}

Widget.Value = ({
  children,
  label,
  delta = 0,
  className = "",
  precision = 0,
}) => (
  <div className={classNames("p-2 lg:p-4", className)}>
    <div className="flex items-baseline justify-center py-2">
      <div className="font-bold text-2xl lg:text-4xl leading-none">
        {children}
      </div>
      {delta && delta !== 0 ? (
        <div className="text-sm lg:text-lg leading-none -mr-2 pl-2 w-0">
          {delta > 0 ? "+" : ""}
          {delta?.toFixed(precision)}
        </div>
      ) : null}
    </div>

    <div className="text-center z-20 text-sm lg:text-base">{label}</div>
  </div>
);

function getTooltipContent(
  dataKey: string,
  locale: string,
  unit?: string,
  precision?: number
) {
  return ({ payload, active, coordinate }) => {
    if (!active || payload == null || !payload[0] || coordinate?.x < 0)
      return null;

    const value = payload[0].payload[dataKey];
    const dayISO = payload[0].payload?.day;
    return (
      <div className="relative">
        <div className="p-1 z-20 relative text-center">
          <p className="text-sm">
            {dayISO
              ? parseAndFormatDate(dayISO, DATE_FORMAT, locale)
              : "Ohne Datum"}
          </p>

          <div className="font-bold">
            <Number precision={precision}>{value}</Number>
            {unit}
          </div>
        </div>
        <div className="bg-gray-300 opacity-75 absolute inset-0 z-10"></div>
      </div>
    );
  };
}

interface DateRow {
  day: string;
  [k: string]: unknown;
}

type ChartProps<Row extends DateRow> = {
  dataKey: keyof Row & string;
  data: Row[];
  color: string;
  unit?: string;
  className?: string;
  precision?: number;
};

Widget.BarChart = function WidgetBarChart<Row extends DateRow>({
  data,
  dataKey,
  color,
  className,
  unit,
  precision,
}: ChartProps<Row>) {
  const locale = useLocale();
  const [highlightedDay, onHighlightDay] = useAtom(highlightedDayAtom);

  return (
    <div className={classNames("h-32 self-end", className)}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={CHART_MARGINS}
          onClick={(d) => {
            if (d) {
              const day = d.activePayload?.[0]?.payload?.day;
              if (day && onHighlightDay) {
                const parsedDay = parseISO(day);
                if (
                  highlightedDay != null &&
                  isSameDay(highlightedDay, parsedDay)
                ) {
                  onHighlightDay(null);
                } else {
                  onHighlightDay(parsedDay);
                }
              }
            }
          }}
        >
          <Tooltip
            content={getTooltipContent(dataKey, locale, unit, precision)}
          />
          <Bar
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.9}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((entry, index) => {
              const entryDay = parseISO(entry.day);
              const shouldHighlightDay =
                highlightedDay && getDay(highlightedDay) === getDay(entryDay);
              return (
                <Cell
                  key={index}
                  fill={shouldHighlightDay ? COLORS.yellow.medium : color}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const intervalRadius = {
  14: { highlighted: 5, default: 3 },
  30: { highlighted: 4, default: 2 },
  60: { highlighted: 3, default: 1.5 },
};

Widget.LineChart = function WidgetLineChart<Row extends DateRow>({
  data,
  dataKey,
  color,
  className,
  unit,
  precision,
}: ChartProps<Row>) {
  const locale = useLocale();
  const [highlightedDay, onHighlightDay] = useAtom(highlightedDayAtom);
  const [interval] = useAtom(intervalAtom);

  return (
    <div className={classNames("h-32 self-end", className)}>
      <ResponsiveContainer>
        <LineChart
          margin={LINE_CHART_MARGINS}
          onClick={(d) => {
            if (d) {
              const day = d.activePayload?.[0]?.payload?.day;
              if (day && onHighlightDay) {
                const parsedDay = parseISO(day);
                if (
                  highlightedDay != null &&
                  isSameDay(highlightedDay, parsedDay)
                ) {
                  onHighlightDay(null);
                } else {
                  onHighlightDay(parsedDay);
                }
              }
            }
          }}
          data={data}
        >
          <YAxis hide />
          <Tooltip
            content={getTooltipContent(dataKey, locale, unit, precision)}
          />
          <Line
            dataKey={dataKey}
            stroke={color}
            fill={color}
            isAnimationActive={false}
            dot={({
              payload,
              dataKey,
              ...props
            }: DotProps & { payload: any; dataKey: string }) => {
              const entryDay = parseISO(payload?.day);
              const shouldHighlightDay =
                highlightedDay && getDay(highlightedDay) === getDay(entryDay);
              let radius = intervalRadius[interval]?.default;

              if (shouldHighlightDay) {
                radius = intervalRadius[interval]?.highlighted;
              }

              return (
                <circle
                  {...props}
                  className={payload.className}
                  // opacity={!highlightOn || shouldHighlightDay ? 1 : 0.4}
                  fill={shouldHighlightDay ? COLORS.yellow.medium : color}
                  stroke={shouldHighlightDay ? "white" : color}
                  strokeWidth={shouldHighlightDay ? 3 : 1}
                  r={radius}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Widget;
