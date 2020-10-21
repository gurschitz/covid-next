import dataApi from "../helpers/dataApi";
import {
  AreaChart,
  Tooltip,
  Area,
  Bar,
  ResponsiveContainer,
  BarChart,
  YAxis,
  Cell,
  DotProps,
} from "recharts";
import classNames from "classnames";
import { parseISO, isToday, getDay } from "date-fns";
import { format } from "date-fns-tz";
import { de as locale } from "date-fns/locale";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS, DATE_FORMAT, TIME_ZONE } from "../helpers/constants";
import { formatNumber } from "../helpers/formatters";
import Number from "../components/Number";
import { createContext, useContext, useState } from "react";

export const CHART_MARGINS = { top: 10, bottom: 0, left: 5, right: 5 };
export const AREA_CHART_MARGINS = { top: 10, bottom: 0, left: -5, right: 10 };

const timeZone = TIME_ZONE;

type HighlightedDayContextProps = [Date | null, (day: Date | null) => void];

const HighlightedDayContext = createContext<HighlightedDayContextProps>([
  null,
  () => {},
]);

function HighlightedDayProvider({ children }) {
  const [day, setDay] = useState<Date | null>(null);
  return (
    <HighlightedDayContext.Provider value={[day, setDay]}>
      {children}
    </HighlightedDayContext.Provider>
  );
}

async function fetchCombinedData() {
  const epicurve = await dataApi.fetchEpicurve();
  const hospitalAndTestData = await dataApi.fetchHospitalAndTestData();
  const reversedHospitalAndTestData = hospitalAndTestData.slice().reverse();
  const reversedEpicurve = epicurve.slice().reverse();
  const combinedData = reversedEpicurve
    .map((v, i) => ({
      ...v,
      ...reversedHospitalAndTestData[i],
    }))
    .reverse()
    .map((v) => {
      const cases = v.sevenDayAvgCases ?? 0;
      const tests = v.sevenDayAvgTests ?? 0;
      return {
        ...v,
        sevenDayAvgNegativeTests: tests - cases,
        positivityRate: tests > 0 ? cases / tests : 0,
      };
    });
  return combinedData;
}

export async function getStaticProps(context) {
  const generalData = await dataApi.fetchGeneralData();
  const versionData = await dataApi.fetchVersionData();
  const combinedData = await fetchCombinedData();

  return {
    props: {
      generalData,
      combinedData,
      versionData,
    },
  };
}

function parseAndFormatDate(day: string, dateFormat: string) {
  return format(parseISO(day), dateFormat, {
    locale,
    timeZone,
  });
}

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
  delta = null,
  className = null,
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

Widget.Chart = ({
  data,
  dataKey,
  color,
  className = null,
  unit = null,
  type = "bar",
  disregardLastEntry = false,
}) => {
  const [highlightedDay, setDay] = useContext(HighlightedDayContext);
  const tooltip = (
    <Tooltip
      content={({ payload, active, coordinate }) => {
        if (!active || payload == null || !payload[0] || coordinate?.x < 0)
          return null;

        const value = payload[0].payload[dataKey];
        const dayISO = payload[0].payload?.day;
        return (
          <div className="relative">
            <div className="p-1 z-20 relative text-center">
              <p className="text-sm">
                {dayISO
                  ? parseAndFormatDate(dayISO, DATE_FORMAT)
                  : "Ohne Datum"}
              </p>

              <div className="font-bold">
                {formatNumber(value)}
                {unit}
              </div>
            </div>
            <div className="bg-gray-300 opacity-75 absolute inset-0 z-10"></div>
          </div>
        );
      }}
    />
  );

  return (
    <div className={classNames("h-24 lg:h-32 self-end", className)}>
      <ResponsiveContainer>
        {type === "area" ? (
          <AreaChart
            onMouseLeave={() => setDay(null)}
            margin={AREA_CHART_MARGINS}
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
            {tooltip}
            <Area
              type={disregardLastEntry ? "basisOpen" : "basis"}
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
                const highlight = getDay(highlightedDay) === getDay(entryDay);
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
          </AreaChart>
        ) : (
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
            {tooltip}
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
                const highlight = getDay(highlightedDay) === getDay(entryDay);
                return (
                  <Cell
                    key={index}
                    fill={highlight ? COLORS.yellow.medium : color}
                  />
                );
              })}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

function NewInfections({ generalData, combinedData, versionData, days }) {
  const lastEntry = combinedData[combinedData.length - 1];
  const versionDate = parseISO(versionData.versionDate);
  const previouslyInfected = combinedData
    .slice(0, combinedData.length - 1)
    .reduce((acc, v) => acc + v.cases, 0);

  let newInfections = generalData.allInfections - previouslyInfected;
  let newInfectionsSinceLastUpdate = newInfections - lastEntry.cases;

  let label = (
    <>
      <div>
        neue Fälle seit{" "}
        {format(versionDate, "dd.MM. HH:mm", {
          locale,
          timeZone,
        })}
      </div>
      <div>(letztes AGES-Update)</div>
    </>
  );

  const reversedCombinedData = combinedData.slice().reverse();
  let data = reversedCombinedData.slice(0, days + 1).reverse();

  return (
    <Widget className="bg-blue-100 text-blue-900">
      <div className="lg:w-1/2 xl:w-2/5">
        <Widget.Value label={label}>
          <Number>{newInfectionsSinceLastUpdate}</Number>
        </Widget.Value>
      </div>
      <Widget.Chart
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

function CurrentValueWithHistory({
  data,
  label,
  value,
  dataKey,
  color,
  className = null,
  calculateDelta = false,
  showDelta = false,
  unit = null,
  type = "bar",
  days = 14,
  precision = 0,
  disregardLastEntry = false,
}) {
  const lastNDays = data
    .slice()
    .reverse()
    .slice(0, days + 1)
    .reverse();
  const lastValueIsToday = isToday(
    parseISO(lastNDays[lastNDays.length - 1].day)
  );
  const prevValue = lastValueIsToday
    ? lastNDays[lastNDays.length - 2][dataKey]
    : lastNDays[lastNDays.length - 1][dataKey];
  const diffBasis = lastValueIsToday
    ? lastNDays[lastNDays.length - 1][dataKey]
    : value;
  const currentValue = lastNDays[lastNDays.length - 1][dataKey];
  const delta = calculateDelta ? diffBasis - prevValue : currentValue;

  return (
    <Widget className={className}>
      <Widget.Value
        className="lg:w-1/2 xl:w-2/5"
        delta={showDelta ? delta : null}
        label={label}
        precision={precision}
      >
        {formatNumber(value)}
        {unit}
      </Widget.Value>

      <Widget.Chart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={lastNDays}
        dataKey={dataKey}
        color={color}
        unit={unit}
        type={type}
        disregardLastEntry={disregardLastEntry}
      />
    </Widget>
  );
}

function Dashboard({ generalData, combinedData, versionData }) {
  const recovered = combinedData.reduce((acc, v) => v.recoveredPerDay + acc, 0);
  const deaths = combinedData.reduce((acc, v) => v.deathsPerDay + acc, 0);
  const activeCases = generalData.allInfections - recovered - deaths;

  return (
    <div>
      <div className="grid lg:grid-cols-3 gap-3 px-3 lg:px-4">
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="positiv getestet">
            <Number>{generalData.allInfections}</Number>
          </Widget.Value>
        </Widget>
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="aktive Fälle">
            <Number>{activeCases}</Number>
          </Widget.Value>
        </Widget>
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="Testungen gesamt">
            <Number>{generalData.allTests}</Number>
          </Widget.Value>
        </Widget>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 py-3 px-3 lg:px-4">
        <NewInfections
          generalData={generalData}
          combinedData={combinedData}
          versionData={versionData}
          days={14}
        />
        <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData}
          label="Ø Testungen (7-Tage-Mittel)"
          value={combinedData.slice().pop().sevenDayAvgTests}
          dataKey="testsPerDay"
          color={COLORS.blue.dark}
          days={14}
        />
        <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData.map((v, i) => ({
            ...v,
            positivityRate: (v.positivityRate * 100).toFixed(2),
            className: i === combinedData.length - 1 ? "opacity-50" : undefined,
          }))}
          label="Positivitätsrate"
          value={(
            combinedData.slice(-2, -1).pop().positivityRate * 100
          ).toFixed(2)}
          unit="%"
          dataKey="positivityRate"
          disregardLastEntry
          color={COLORS.blue.dark}
          type="area"
          days={14}
        />

        <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData}
          label={
            <>
              <div>7-Tage-Inzidenz</div>
              <div>(pro 100.000 Einwohner)</div>
            </>
          }
          value={combinedData[combinedData.length - 1].sevenDay}
          dataKey="sevenDay"
          color={COLORS.blue.dark}
          calculateDelta
          showDelta
          type="area"
        />
        <CurrentValueWithHistory
          className="bg-red-100 text-red-900"
          data={combinedData.map((v) => ({
            ...v,
            icuOccupancy: (v.icuOccupancy * 100).toFixed(2),
          }))}
          label="Intensiv Auslastung"
          value={(combinedData.slice().pop().icuOccupancy * 100).toFixed(2)}
          unit="%"
          dataKey="icuOccupancy"
          color={COLORS.red.dark}
          type="area"
        />

        <CurrentValueWithHistory
          className="bg-red-100 text-red-900"
          data={combinedData}
          label="Intensiv"
          value={generalData.icu}
          dataKey="icu"
          color={COLORS.red.dark}
          calculateDelta
          showDelta
        />

        <CurrentValueWithHistory
          className="bg-yellow-100 text-yellow-900"
          data={combinedData.map((v) => ({
            ...v,
            hospitalOccupancy: (v.hospitalOccupancy * 100).toFixed(2),
          }))}
          label="Spital Auslastung (ohne Intensiv)"
          value={(combinedData.slice().pop().hospitalOccupancy * 100).toFixed(
            2
          )}
          unit="%"
          dataKey="hospitalOccupancy"
          color={COLORS.yellow.dark}
          type="area"
        />
        <CurrentValueWithHistory
          className="bg-yellow-100 text-yellow-900"
          data={combinedData}
          label="Spital (ohne Intensiv)"
          value={generalData.hospitalized}
          dataKey="hospitalized"
          color={COLORS.yellow.dark}
          calculateDelta
          showDelta
        />

        <CurrentValueWithHistory
          className="bg-green-100 text-green-900"
          data={combinedData}
          label="Genesen"
          value={recovered}
          dataKey="recoveredPerDay"
          color={COLORS.green.dark}
          showDelta
        />
        <CurrentValueWithHistory
          className="bg-gray-100 text-gray-900"
          data={combinedData}
          label="Todesfälle"
          value={deaths}
          dataKey="deathsPerDay"
          color={COLORS.gray.dark}
          showDelta
        />
      </div>
    </div>
  );
}

export default function Home({ generalData, combinedData, versionData }) {
  return (
    <HighlightedDayProvider>
      <div className="container mx-auto">
        <Header lastUpdated={generalData.lastUpdated} />
        <Dashboard
          generalData={generalData}
          combinedData={combinedData}
          versionData={versionData}
        />
        <Footer />
      </div>
    </HighlightedDayProvider>
  );
}
