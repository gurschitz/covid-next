import dataApi, { GeneralData, TimelineRow } from "../helpers/dataApi";
import {
  ComposedChart,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  Bar,
  ResponsiveContainer,
} from "recharts";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Head from "../components/Head";
import { CHART_MARGINS, COLORS, DATE_FORMAT } from "../helpers/constants";
import { parseAndFormatDate, useNumberFormatter } from "../helpers/formatters";
import Number from "../components/Number";
import getMessages from "../helpers/getMessages";
import { FormattedMessage } from "react-intl";
import IntlProvider, { useLocale } from "../components/IntlProvider";

type DataProps = {
  generalData: GeneralData;
  timeline: TimelineRow[];
};

type IntlProps = {
  locale: string;
  messages: any;
};

type Props = DataProps & IntlProps;

export async function getStaticProps({ locale }): Promise<{ props: Props }> {
  const timeline = await dataApi.fetchTimeline();
  const generalData = await dataApi.fetchGeneralData();
  const messages = await getMessages(locale);

  return {
    props: { timeline, generalData, locale, messages },
  };
}

function ChartHeader({ children }) {
  return (
    <h2 className="text-2xl text-gray-700 mb-2 text-center">{children}</h2>
  );
}

const CHART_HEIGHT = 200;

interface ChartWithData {
  data: any[];
}

function CasesLogChart({ data }: ChartWithData) {
  const locale = useLocale();
  const formatNumber = useNumberFormatter();

  return (
    <div className="h-48 lg:h-96">
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart data={data.slice(0, -1)} margin={CHART_MARGINS}>
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis
            yAxisId="left"
            orientation="left"
            scale="log"
            domain={["auto", "auto"]}
          />

          <Tooltip
            content={({ payload, active }) => {
              if (!active || payload == null || !payload[0]) return null;

              const { cases, sevenDayCalculated, day } = payload[0].payload;
              return (
                <div className="relative">
                  <div className="p-4 z-20 relative text-center">
                    <p className="text-sm mb-4">
                      {parseAndFormatDate(day, DATE_FORMAT, locale)}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs">
                          <FormattedMessage
                            id="common.cases"
                            defaultMessage="Fälle"
                          />
                        </div>
                        <div className="font-bold">
                          <Number>{cases}</Number>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xs">
                          <FormattedMessage
                            id="common.seven_day_incidence"
                            defaultMessage="7-Tage-Inzidenz"
                          />
                        </div>
                        <div className="font-bold">
                          {sevenDayCalculated?.toFixed(2) ?? 0}
                        </div>
                        <div className="text-xs">
                          <FormattedMessage
                            id="common.per_x_inhabitants"
                            defaultMessage="per {x} Einwohner"
                            values={{ x: formatNumber(100000) }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
                </div>
              );
            }}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="sevenDayCalculated"
            stroke={COLORS.blue.dark}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function CasesChart({ data }: ChartWithData) {
  const locale = useLocale();
  const formatNumber = useNumberFormatter();

  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data.slice(0, -1)} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const { cases, sevenDayCalculated, day } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, DATE_FORMAT, locale)}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.cases"
                          defaultMessage="Fälle"
                        />
                      </div>
                      <div className="font-bold">
                        <Number>{cases}</Number>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.seven_day_incidence"
                          defaultMessage="7-Tage-Inzidenz"
                        />
                      </div>
                      <div className="font-bold">
                        {sevenDayCalculated?.toFixed(2) ?? 0}
                      </div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.per_x_inhabitants"
                          defaultMessage="per {x} Einwohner"
                          values={{ x: formatNumber(100000) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="cases"
          fill={COLORS.gray.light}
          isAnimationActive={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sevenDayCalculated"
          stroke={COLORS.blue.dark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function TestsChart({ data }: ChartWithData) {
  const locale = useLocale();

  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data.slice(0, -1)} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const {
              positivityRate,
              sevenDayAvgTests,
              day,
            } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, DATE_FORMAT, locale)}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.seven_day_average"
                          defaultMessage="7-Tage-Mittel"
                        />
                      </div>
                      <div className="font-bold">
                        <Number precision={0}>{sevenDayAvgTests}</Number>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.positivity_rate"
                          defaultMessage="Positivitätsrate"
                        />
                      </div>
                      <div className="font-bold">
                        <Number precision={2} unit="%">
                          {positivityRate * 100}
                        </Number>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="sevenDayAvgCases"
          stackId="a"
          fill={COLORS.blue.dark}
          isAnimationActive={false}
        />
        <Bar
          yAxisId="left"
          dataKey="sevenDayAvgNegativeTests"
          stackId="a"
          fill={COLORS.gray.light}
          isAnimationActive={false}
        />

        <Line
          yAxisId="right"
          type="monotone"
          dataKey="positivityRate"
          stroke={COLORS.red.dark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function HospitalChart({ data }: ChartWithData) {
  const locale = useLocale();

  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const {
              hospitalized,
              hospitalFree,
              hospitalOccupancy,
              day,
            } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, DATE_FORMAT, locale)}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.occupied"
                          defaultMessage="Belegt"
                        />
                      </div>
                      <div className="font-bold">
                        <Number>{hospitalized}</Number>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.empty"
                          defaultMessage="Frei"
                        />
                      </div>
                      <div className="font-bold">
                        <Number>{hospitalFree}</Number>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.occupancy_rate"
                          defaultMessage="Auslastung"
                        />
                      </div>
                      <div className="font-bold">
                        <Number precision={2} unit="%">
                          {hospitalOccupancy * 100}
                        </Number>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="hospitalized"
          stackId="a"
          fill={COLORS.yellow.medium}
          isAnimationActive={false}
        />
        <Bar
          yAxisId="left"
          dataKey="hospitalFree"
          stackId="a"
          fill={COLORS.gray.light}
          isAnimationActive={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="hospitalOccupancy"
          stroke={COLORS.yellow.dark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ICUChart({ data }: ChartWithData) {
  const locale = useLocale();

  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" hide />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const { icu, icuFree, icuOccupancy, day } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, DATE_FORMAT, locale)}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.occupied"
                          defaultMessage="Belegt"
                        />
                      </div>
                      <div className="font-bold">
                        <Number>{icu}</Number>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.empty"
                          defaultMessage="Frei"
                        />
                      </div>
                      <div className="font-bold">
                        <Number>{icuFree}</Number>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.occupancyRate"
                          defaultMessage="Auslastung"
                        />
                      </div>
                      <div className="font-bold">
                        <Number unit="%" precision={2}>
                          {icuOccupancy * 100}
                        </Number>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="icu"
          stackId="a"
          fill={COLORS.red.medium}
          isAnimationActive={false}
        />
        <Bar
          yAxisId="left"
          dataKey="icuFree"
          stackId="a"
          fill={COLORS.gray.light}
          isAnimationActive={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="icuOccupancy"
          stroke={COLORS.red.dark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function DeathsChart({ data }: ChartWithData) {
  const locale = useLocale();

  return (
    <ResponsiveContainer height={CHART_HEIGHT} width="100%">
      <ComposedChart data={data} margin={CHART_MARGINS}>
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis yAxisId="right" orientation="right" hide />
        <YAxis yAxisId="left" orientation="left" />
        <Tooltip
          content={({ payload, active }) => {
            if (!active || payload == null || !payload[0]) return null;

            const { sevenDayDeaths, day, deathsPerDay } = payload[0].payload;
            return (
              <div className="relative">
                <div className="p-4 z-20 relative text-center">
                  <p className="text-sm mb-4">
                    {parseAndFormatDate(day, DATE_FORMAT, locale)}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.tests"
                          defaultMessage="Testungen"
                        />
                      </div>
                      <div className="font-bold">
                        <Number>{deathsPerDay}</Number>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs">
                        <FormattedMessage
                          id="common.seven_day_incidence"
                          defaultMessage="7-Tage-Inzidenz"
                        />
                      </div>
                      <div className="font-bold">
                        <Number precision={2}>{sevenDayDeaths}</Number>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-300 opacity-50 absolute inset-0 z-10"></div>
              </div>
            );
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="deathsPerDay"
          fill={COLORS.gray.light}
          isAnimationActive={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="sevenDayDeaths"
          stroke={COLORS.gray.dark}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function Charts({ generalData, timeline }: DataProps) {
  return (
    <>
      <Head>
        {(intl) => (
          <title>
            {intl.formatMessage({
              id: "common.charts",
            })}{" "}
            |{" "}
            {intl.formatMessage({
              id: "header.title",
            })}
          </title>
        )}
      </Head>
      <Header lastUpdated={generalData.lastUpdated} />
      <div className="container mx-auto py-4">
        <div className="px-3 py-4 lg:px-4 space-y-12">
          <div>
            <ChartHeader>
              <FormattedMessage id="common.cases" defaultMessage="Fälle" />
            </ChartHeader>
            <CasesChart data={timeline} />
          </div>

          <div>
            <ChartHeader>
              <FormattedMessage
                id="common.cases_logarithmic"
                defaultMessage="Fälle (logarithmische Skala)"
              />
            </ChartHeader>
            <CasesLogChart data={timeline} />
          </div>

          <div>
            <ChartHeader>
              <FormattedMessage id="common.tests" defaultMessage="Testungen" />
            </ChartHeader>
            <TestsChart data={timeline} />
          </div>

          <div>
            <ChartHeader>
              <FormattedMessage
                id="common.hospitalized"
                defaultMessage="Spital (ohne Intensiv)"
              />
            </ChartHeader>
            <HospitalChart data={timeline} />
          </div>

          <div>
            <ChartHeader>
              <FormattedMessage id="common.icu" defaultMessage="Intensiv" />
            </ChartHeader>
            <ICUChart data={timeline} />
          </div>

          <div>
            <ChartHeader>
              <FormattedMessage
                id="common.deaths"
                defaultMessage="Todesfälle"
              />
            </ChartHeader>
            <DeathsChart data={timeline} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function Index({ locale, messages, ...props }: Props) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <Charts {...props} />
    </IntlProvider>
  );
}
