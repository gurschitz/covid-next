import dataApi from "../helpers/dataApi";
import {
  AreaChart,
  Tooltip,
  Area,
  Bar,
  ResponsiveContainer,
  BarChart,
  YAxis,
} from "recharts";
import classNames from "classnames";
import { parseISO, isToday } from "date-fns";
import { format } from "date-fns-tz";
import { de as locale } from "date-fns/locale";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS, DATE_FORMAT } from "../helpers/constants";
import { formatNumber } from "../helpers/formatters";
import Number from "../components/Number";

export const CHART_MARGINS = { top: 10, bottom: 0, left: 0, right: 0 };

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
    timeZone: "Europe/Vienna",
  });
}

function Widget({ children, className }) {
  return (
    <div
      className={classNames(
        "rounded-lg overflow-hidden flex flex-col lg:flex-row items-center lg:items-end justify-center relative text-center",
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
}) => {
  const tooltip = (
    <Tooltip
      content={({ payload, active }) => {
        if (!active || payload == null || !payload[0]) return null;

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
    <div className={classNames("h-24 lg:h-32", className)}>
      <ResponsiveContainer>
        {type === "area" ? (
          <AreaChart margin={CHART_MARGINS} data={data}>
            <YAxis hide domain={[0, (dataMax) => dataMax * 1.5]} />
            {tooltip}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              isAnimationActive={false}
              dot={{ stroke: color, fillOpacity: 1 }}
            />
          </AreaChart>
        ) : (
          <BarChart margin={CHART_MARGINS} data={data}>
            {tooltip}
            <Bar
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.9}
              strokeWidth={0}
              isAnimationActive={false}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

function NewInfections({ generalData, combinedData, versionData }) {
  const lastEntry = combinedData[combinedData.length - 1];
  const day = parseISO(lastEntry?.day);
  const versionDate = parseISO(versionData.versionDate);
  const isLatestUpdateFromToday = isToday(versionDate);
  const previouslyInfected = combinedData
    .slice(0, combinedData.length - 1)
    .reduce((acc, v) => acc + v.cases, 0);

  let newInfections = generalData.allInfections - previouslyInfected;
  let label = (
    <>
      <div>neue Fälle seit</div>
      <div>
        {format(versionDate, DATE_FORMAT, {
          locale,
          timeZone: "Europe/Vienna",
        })}{" "}
        14:02 Uhr
      </div>
    </>
  );

  const reversedCombinedData = combinedData.slice().reverse();
  let data = reversedCombinedData.slice(0, 30).reverse();

  if (isLatestUpdateFromToday) {
    label = (
      <>
        <div>neue Fälle seit</div>
        <div>
          {format(day, DATE_FORMAT, {
            locale,
          })}{" "}
          00:00 Uhr
        </div>
      </>
    );
  } else {
    newInfections = newInfections - lastEntry.cases;
  }

  return (
    <Widget className="bg-blue-100 text-blue-900">
      <Widget.Value className="lg:w-1/2 xl:w-2/5" label={label}>
        {formatNumber(newInfections)}
      </Widget.Value>

      <Widget.Chart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={data.slice(0, -1)}
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
}) {
  const lastNDays = data.slice().reverse().slice(0, days).reverse();
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
      />
    </Widget>
  );
}

function Dashboard({ generalData, combinedData, versionData }) {
  return (
    <div>
      <div className="grid lg:grid-cols-4 gap-3 px-3 lg:px-4">
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="positiv getestet">
            {formatNumber(generalData.allInfections)}
          </Widget.Value>
        </Widget>
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="aktive Fälle">
            {formatNumber(generalData.activeCases)}
          </Widget.Value>
        </Widget>
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="Testungen gesamt">
            {formatNumber(generalData.allTests)}
          </Widget.Value>
        </Widget>
        <Widget className="bg-gray-200 text-gray-900">
          <Widget.Value label="Ø Testungen (7-Tage-Mittel)">
            <Number>{combinedData.slice().pop().sevenDayAvgTests}</Number>
          </Widget.Value>
        </Widget>
      </div>
      <div className="grid pt-8 px-3 lg:px-4">
        <NewInfections
          generalData={generalData}
          combinedData={combinedData}
          versionData={versionData}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-3 py-3 px-3 lg:px-4">
        <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData.slice(0, -1).map((v) => ({
            ...v,
            positivityRate: (v.positivityRate * 100).toFixed(2),
          }))}
          label="Positivitätsrate"
          value={(
            combinedData.slice(-2, -1).pop().positivityRate * 100
          ).toFixed(2)}
          unit="%"
          dataKey="positivityRate"
          color={COLORS.blue.dark}
          type="area"
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
          value={generalData.recovered}
          dataKey="recoveredPerDay"
          color={COLORS.green.dark}
          showDelta
        />
        <CurrentValueWithHistory
          className="bg-gray-100 text-gray-900"
          data={combinedData}
          label="Todesfälle"
          value={combinedData.reduce((acc, v) => v.deathsPerDay + acc, 0)}
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
    <div className="container mx-auto">
      <Header lastUpdated={generalData.lastUpdated} />
      <Dashboard
        generalData={generalData}
        combinedData={combinedData}
        versionData={versionData}
      />
      <Footer />
    </div>
  );
}
