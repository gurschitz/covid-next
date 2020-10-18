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
import { format, parseISO, isToday } from "date-fns";
import { de as locale } from "date-fns/locale";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS, DATE_FORMAT, DATE_TIME_FORMAT } from "../helpers/constants";

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
  console.log(day);
  return format(parseISO(day), dateFormat, { locale });
}

function Number({ children, className }) {
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

Number.Value = ({
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

Number.Chart = ({
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
        const estimatedLabel = payload[0].payload?.estimatedLabel;
        return (
          <div className="relative">
            <div className="p-1 z-20 relative text-center">
              <p className="text-sm">
                {dayISO
                  ? parseAndFormatDate(dayISO, DATE_FORMAT)
                  : "Ohne Datum"}
              </p>

              <div className="font-bold">
                {value}
                {unit}
                {estimatedLabel && "*"}
              </div>
              {estimatedLabel && (
                <div className="text-xs">*{estimatedLabel}</div>
              )}
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
        {format(versionDate, DATE_TIME_FORMAT, {
          locale,
        })}{" "}
        Uhr
      </div>
    </>
  );

  const reversedCombinedData = combinedData.slice().reverse();
  let data = reversedCombinedData.slice(0, 14).reverse();

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

    data[data.length - 1] = {
      ...lastEntry,
      cases: newInfections,
      estimatedLabel: "Daten unvollständig",
    };
  } else {
    newInfections = newInfections - lastEntry.cases;
    data = [
      ...data,
      {
        cases: newInfections,
        estimatedLabel: "Daten tlw. von Vortag",
      },
    ];
  }

  return (
    <Number className="bg-blue-100 text-blue-900">
      <Number.Value className="lg:w-1/2 xl:w-2/5" label={label}>
        {newInfections}
      </Number.Value>

      <Number.Chart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={data}
        dataKey="cases"
        color={COLORS.blue.dark}
      />
    </Number>
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
    <Number className={className}>
      <Number.Value
        className="lg:w-1/2 xl:w-2/5"
        delta={showDelta ? delta : null}
        label={label}
        precision={precision}
      >
        {value}
        {unit}
      </Number.Value>

      <Number.Chart
        className="w-full lg:w-1/2 xl:w-3/5"
        data={lastNDays}
        dataKey={dataKey}
        color={color}
        unit={unit}
        type={type}
      />
    </Number>
  );
}

function Dashboard({ generalData, combinedData, versionData }) {
  return (
    <div>
      <div className="grid lg:grid-cols-3 gap-3 px-3 lg:px-4">
        <Number className="bg-gray-200 text-gray-900">
          <Number.Value label="positiv getestet">
            {generalData.allInfections}
          </Number.Value>
        </Number>
        <Number className="bg-gray-200 text-gray-900">
          <Number.Value label="aktive Fälle">
            {generalData.activeCases}
          </Number.Value>
        </Number>
        <Number className="bg-gray-200 text-gray-900">
          <Number.Value label="Testungen gesamt">
            {generalData.allTests}
          </Number.Value>
        </Number>
      </div>
      <div className="grid lg:grid-cols-2 gap-3 py-4 px-3 lg:px-4">
        <NewInfections
          generalData={generalData}
          combinedData={combinedData}
          versionData={versionData}
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
        {/* <CurrentValueWithHistory
          className="bg-blue-100 text-blue-900"
          data={combinedData}
          label="7-Tage-Mittel (pro 100.000 Einwohner)"
          value={combinedData[combinedData.length - 1].sevenDayAvgCasesPer100}
          dataKey="sevenDayAvgCasesPer100"
          color={COLORS.blue.dark}
          calculateDelta
          showDelta
          type="area"
          precision={2}
        /> */}
        <CurrentValueWithHistory
          className="bg-green-100 text-green-900"
          data={combinedData}
          label={
            <>
              <div>Ø Testungen pro Tag</div>
              <div>(7-Tage-Mittel)</div>
            </>
          }
          value={combinedData[combinedData.length - 1].sevenDayAvgTests}
          dataKey="sevenDayAvgTests"
          color={COLORS.green.dark}
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
          className="bg-yellow-100 text-yellow-900"
          data={combinedData.map((v) => ({
            ...v,
            positivityRate: (v.positivityRate * 100).toFixed(2),
          }))}
          label="Positivitätsrate"
          value={(
            combinedData[combinedData.length - 1].positivityRate * 100
          ).toFixed(2)}
          unit="%"
          dataKey="positivityRate"
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
          className="bg-red-100 text-red-900"
          data={combinedData}
          label="Todesfälle"
          value={combinedData.reduce((acc, v) => v.deathsPerDay + acc, 0)}
          dataKey="deathsPerDay"
          color={COLORS.red.dark}
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
