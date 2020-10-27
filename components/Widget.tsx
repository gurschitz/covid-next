import React from "react";
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
import { formatNumber, parseAndFormatDate } from "../helpers/formatters";
import { COLORS, DATE_FORMAT } from "../helpers/constants";
import { parseISO } from "date-fns";
import { getDay } from "date-fns";

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

function getTooltipContent(dataKey: string, unit?: string) {
  return ({ payload, active, coordinate }) => {
    if (!active || payload == null || !payload[0] || coordinate?.x < 0)
      return null;

    const value = payload[0].payload[dataKey];
    const dayISO = payload[0].payload?.day;
    return (
      <div className="relative">
        <div className="p-1 z-20 relative text-center">
          <p className="text-sm">
            {dayISO ? parseAndFormatDate(dayISO, DATE_FORMAT) : "Ohne Datum"}
          </p>

          <div className="font-bold">
            {formatNumber(value)}
            {unit}
          </div>
        </div>
        <div className="bg-gray-300 opacity-75 absolute inset-0 z-10"></div>
      </div>
    );
  };
}

Widget.BarChart = ({ data, dataKey, color, className, unit = "" }) => {
  const [highlightedDay, setDay] = useAtom(highlightedDayAtom);

  return (
    <div className={classNames("h-24 lg:h-32 self-end", className)}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          onMouseLeave={() => setDay(null)}
          margin={CHART_MARGINS}
          onMouseMove={(d) => {
            if (d) {
              const day = d.activePayload?.[0]?.payload?.day;
              if (day) {
                setDay(parseISO(day));
              }
            }
          }}
        >
          <Tooltip content={getTooltipContent(dataKey, unit)} />
          <Bar
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.9}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((entry, index) => {
              const entryDay = parseISO(entry?.day);
              const highlight =
                highlightedDay && getDay(highlightedDay) === getDay(entryDay);
              return (
                <Cell
                  key={index}
                  fill={highlight ? COLORS.yellow.medium : color}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

Widget.LineChart = ({ data, dataKey, color, className = "", unit = "" }) => {
  const [highlightedDay, setDay] = useAtom(highlightedDayAtom);

  return (
    <div className={classNames("h-24 lg:h-32 self-end", className)}>
      <ResponsiveContainer>
        <LineChart
          onMouseLeave={() => setDay(null)}
          margin={LINE_CHART_MARGINS}
          onMouseMove={(d) => {
            if (d) {
              const day = d.activePayload?.[0]?.payload?.day;
              if (day) {
                setDay(parseISO(day));
              }
            }
          }}
          data={data}
        >
          <YAxis hide domain={[0, (dataMax) => dataMax * 1.5]} />
          <Tooltip content={getTooltipContent(dataKey, unit)} />
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
              const highlight =
                highlightedDay && getDay(highlightedDay) === getDay(entryDay);
              return (
                <circle
                  {...props}
                  className={payload.className}
                  fillOpacity={1}
                  fill={highlight ? COLORS.yellow.medium : color}
                  stroke={highlight ? "white" : color}
                  strokeWidth={highlight ? 3 : 1}
                  r={highlight ? 5 : 3}
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
