import dataApi from "../helpers/dataApi";
import {
  ComposedChart,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  Bar,
  ResponsiveContainer,
  BarChart,
} from "recharts";
import classNames from "classnames";
import { format, parseISO, isToday } from "date-fns";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Header from "../components/Header";

export async function getStaticProps(context) {
  const epicurve = await dataApi.fetchEpicurve();
  const generalData = await dataApi.fetchGeneralData();
  const hospitalAndTestData = await dataApi.fetchHospitalAndTestData();
  return {
    props: { epicurve, hospitalAndTestData, generalData },
  };
}

const CHART_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

const COLORS = {
  blue: {
    light: "#bee3f8",
    medium: "#4299e1",
    dark: "#2a4365",
  },
  gray: {
    light: "#cbd5e0",
    medium: "#a0aec0",
    dark: "#1a202c",
  },
  yellow: {
    medium: "#d69e2e",
    dark: "#975a16",
  },
  red: {
    light: "#feb2b2",
    medium: "#f56565",
    dark: "#9b2c2c",
  },
};

function parseAndFormatDate(day: string, dateFormat: string) {
  return format(parseISO(day), dateFormat);
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

Number.Value = ({ children, label, delta = null, className = null }) => (
  <div className={classNames("p-2 lg:p-4", className)}>
    <div className="flex items-baseline justify-center py-2">
      <div className="font-bold text-2xl lg:text-4xl leading-none">
        {children}
      </div>
      {delta && delta !== 0 ? (
        <div className="text-sm lg:text-lg leading-none -mr-2 pl-2 w-0">
          {delta > 0 ? "+" : "-"}
          {delta}
        </div>
      ) : null}
    </div>

    <div className="text-center z-20 text-sm lg:text-base">{label}</div>
  </div>
);

Number.Chart = ({ data, dataKey, color }) => (
  <div className="h-24 w-full lg:w-3/5">
    <ResponsiveContainer>
      <BarChart margin={CHART_MARGINS} data={data}>
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const value = payload[0].payload[dataKey];
            const dayISO = payload[0].payload?.day;
            return (
              <div className="relative">
                <div className="p-1 z-20 relative text-center">
                  {dayISO && (
                    <p className="text-sm">
                      {parseAndFormatDate(dayISO, "dd.MM.yyy")}
                    </p>
                  )}

                  <div className="font-bold">{value}</div>
                </div>
                <div className="bg-gray-300 opacity-75 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />

        <Bar
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.9}
          strokeWidth={0}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

function NewInfections({ generalData, epicurve }) {
  const lastEntry = epicurve[epicurve.length - 1];
  const day = parseISO(lastEntry?.day);
  const today = new Date();
  const shouldUseLastUpdate = today > day;

  const previouslyInfected = epicurve
    .slice(0, shouldUseLastUpdate ? epicurve.length : epicurve.length - 1)
    .reduce((acc, v) => acc + v.cases, 0);
  const newInfections = generalData.allInfections - previouslyInfected;
  let label = null;
  if (shouldUseLastUpdate) {
    label = "neue Fälle seit dem letztem AGES-Update";
  } else if (day) {
    label = `neue Fälle seit ${format(day, "dd.MM.yyy")} 00:00 Uhr`;
  }

  return (
    <Number className="bg-blue-100 text-blue-900">
      <Number.Value className="lg:w-2/5" label={label}>
        {newInfections}
      </Number.Value>

      <Number.Chart
        data={epicurve.slice().reverse().slice(0, 14).reverse()}
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
  calculateDiff = false,
}) {
  const last14Days = data.slice().reverse().slice(0, 14).reverse();
  const lastValueIsToday = isToday(
    parseISO(last14Days[last14Days.length - 1].day)
  );
  const prevValue = lastValueIsToday
    ? last14Days[last14Days.length - 2][dataKey]
    : last14Days[last14Days.length - 1][dataKey];
  const diffBasis = lastValueIsToday
    ? last14Days[last14Days.length - 1][dataKey]
    : value;
  const currentValue = last14Days[last14Days.length - 1][dataKey];

  return (
    <Number className={className}>
      <Number.Value
        className="lg:w-2/5"
        delta={calculateDiff ? diffBasis - prevValue : currentValue}
        label={label}
      >
        {value}
      </Number.Value>

      <Number.Chart data={last14Days} dataKey={dataKey} color={color} />
    </Number>
  );
}

function Dashboard({ generalData, epicurve, hospitalAndTestData }) {
  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-2 lg:gap-4 py-1 px-3 lg:py-4 lg:px-4">
        <NewInfections generalData={generalData} epicurve={epicurve} />

        <CurrentValueWithHistory
          className="bg-yellow-100 text-yellow-900"
          data={hospitalAndTestData}
          label="Spital (ohne Intensiv)"
          value={generalData.hospitalized}
          dataKey="hospitalized"
          color={COLORS.yellow.dark}
          calculateDiff
        />
        <CurrentValueWithHistory
          className="bg-red-100 text-red-900"
          data={hospitalAndTestData}
          label="Intensiv"
          value={generalData.icu}
          dataKey="icu"
          color={COLORS.red.dark}
          calculateDiff
        />
        <CurrentValueWithHistory
          className="bg-gray-200 text-gray-900"
          data={epicurve}
          label="Todesfälle"
          value={epicurve.reduce((acc, v) => v.deathsPerDay + acc, 0)}
          dataKey="deathsPerDay"
          color={COLORS.gray.dark}
        />
      </div>
      <div className="grid lg:grid-cols-3 gap-2 lg:gap-4 py-1 px-2 lg:py-4 lg:px-4">
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
          <Number.Value label="Testungen">{generalData.allTests}</Number.Value>
        </Number>
      </div>
    </div>
  );
}

export default function Home({ epicurve, generalData, hospitalAndTestData }) {
  return (
    <div className="container mx-auto">
      <Header lastUpdated={generalData.lastUpdated} />
      <Nav />
      <Dashboard
        generalData={generalData}
        epicurve={epicurve}
        hospitalAndTestData={hospitalAndTestData}
      />
      <Footer />
    </div>
  );
}
