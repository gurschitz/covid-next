import React from "react";
import dataApi, {
  GeneralData,
  TimelineRow,
  VersionData,
} from "../helpers/dataApi";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS } from "../helpers/constants";
import Number from "../components/Number";
import Widget from "../components/Widget";
import TimelineWidget from "../components/TimelineWidget";
import NewCases from "../components/NewCases";
import { useAtom } from "jotai";
import IntervalButton, { intervalAtom } from "../components/IntervalButton";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import getMessages from "../helpers/getMessages";
import { useNumberFormatter } from "../helpers/formatters";
import IntlProvider from "../components/IntlProvider";
import Head from "../components/Head";

type DataProps = {
  generalData: GeneralData;
  timeline: TimelineRow[];
  versionData: VersionData;
};

type IntlProps = {
  locale: string;
  messages: any;
};

type Props = DataProps & IntlProps;

export async function getStaticProps({ locale }): Promise<{ props: Props }> {
  const generalData = await dataApi.fetchGeneralData();
  const versionData = await dataApi.fetchVersionData();
  const timeline = await dataApi.fetchTimeline();
  const messages = await getMessages(locale);

  return {
    props: {
      generalData,
      timeline,
      versionData,
      locale,
      messages,
    },
  };
}

function GeneralDataWidgets({ allTests, deaths, recovered, allCases }) {
  const activeCases = allCases - recovered - deaths;

  return (
    <div className="grid lg:grid-cols-3 gap-3 px-3 lg:px-4">
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value
          label={
            <FormattedMessage
              id="common.total_cases"
              defaultMessage="Fälle gesamt"
            />
          }
        >
          <Number>{allCases}</Number>
        </Widget.Value>
      </Widget>
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value
          label={
            <FormattedMessage
              id="common.active_cases"
              defaultMessage="aktive Fälle"
            />
          }
        >
          <Number>{activeCases}</Number>
        </Widget.Value>
      </Widget>
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value
          label={
            <FormattedMessage
              id="common.total_tests"
              defaultMessage="Testungen gesamt"
            />
          }
        >
          <Number>{allTests}</Number>
        </Widget.Value>
      </Widget>
    </div>
  );
}

type TimelineWidgetsProps = {
  generalData: GeneralData;
  timeline: TimelineRow[];
  versionData: VersionData;
  deaths: number;
  recovered: number;
};

function TimelineWidgets({
  generalData,
  timeline,
  versionData,
  deaths,
  recovered,
}: TimelineWidgetsProps) {
  const formatNumber = useNumberFormatter();
  const [interval] = useAtom(intervalAtom);

  return (
    <div className="py-3 px-3 lg:px-4">
      <div className="flex justify-center lg:justify-end items-center space-x-4 w-full pt-4 pb-3">
        <IntervalButton interval={14} />
        <IntervalButton interval={30} />
        <IntervalButton interval={60} />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <TimelineWidget
          className="bg-blue-100 text-blue-900"
          data={timeline}
          dataKey="sevenDay"
          days={interval}
        >
          <TimelineWidget.Value
            calculateDelta
            showDelta
            label={
              <>
                <div>
                  <FormattedMessage
                    id="common.seven_day_incidence"
                    defaultMessage="7-Tage-Inzidenz"
                  />
                </div>
                <div>
                  (
                  <FormattedMessage
                    id="common.per_x_inhabitants"
                    defaultMessage="pro {x} Einwohner"
                    values={{ x: formatNumber(100000) }}
                  />
                  )
                </div>
              </>
            }
          >
            {timeline[timeline.length - 1].sevenDay}
          </TimelineWidget.Value>
          <TimelineWidget.LineChart color={COLORS.blue.dark} />
        </TimelineWidget>
        <NewCases
          allCases={generalData.allCases}
          timeline={timeline}
          versionData={versionData}
          days={interval}
        />

        <TimelineWidget
          className="bg-blue-100 text-blue-900"
          data={timeline.map((v, i) => ({
            ...v,
            positivityRate: v.positivityRate * 100,
            className: i === timeline.length - 1 ? "opacity-50" : undefined,
          }))}
          unit="%"
          dataKey="positivityRate"
          days={interval}
        >
          <TimelineWidget.Value
            precision={2}
            label={
              <FormattedMessage
                id="common.positivity_rate"
                defaultMessage="Positivitätsrate"
              />
            }
          >
            {(timeline.slice(-2, -1).pop()?.positivityRate ?? 0) * 100}
          </TimelineWidget.Value>
          <TimelineWidget.LineChart color={COLORS.blue.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-blue-100 text-blue-900"
          data={timeline}
          days={interval}
          dataKey="sevenDayAvgTests"
        >
          <TimelineWidget.Value
            label={
              <>
                {"Ø "}
                <FormattedMessage
                  id="common.tests"
                  defaultMessage="Testungen"
                />{" "}
                (
                <FormattedMessage
                  id="common.seven_day_average"
                  defaultMessage="7-Tage-Mittel"
                />
                )
              </>
            }
          >
            {timeline.slice().pop()?.sevenDayAvgTests ?? 0}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.blue.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-red-100 text-red-900"
          data={timeline.map((v) => ({
            ...v,
            icuOccupancy: v.icuOccupancy * 100,
          }))}
          dataKey="icuOccupancy"
          days={interval}
          unit="%"
        >
          <TimelineWidget.Value
            label={
              <FormattedMessage
                id="common.icu_occupancy_rate"
                defaultMessage="Instensiv Auslastung"
              />
            }
            precision={2}
          >
            {(timeline.slice().pop()?.icuOccupancy ?? 0) * 100}
          </TimelineWidget.Value>
          <TimelineWidget.LineChart color={COLORS.red.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-red-100 text-red-900"
          data={timeline}
          dataKey="icu"
          days={interval}
        >
          <TimelineWidget.Value
            calculateDelta
            showDelta
            label={
              <FormattedMessage id="common.icu" defaultMessage="Instensiv" />
            }
          >
            {generalData.icu}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.red.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-yellow-100 text-yellow-900"
          data={timeline.map((v) => ({
            ...v,
            hospitalOccupancy: v.hospitalOccupancy * 100,
          }))}
          dataKey="hospitalOccupancy"
          days={interval}
          unit="%"
        >
          <TimelineWidget.Value
            precision={2}
            label={
              <FormattedMessage
                id="common.hospitalized_occupancy_rate"
                defaultMessage="Spital Auslastung (ohne Intensiv)"
              />
            }
          >
            {(timeline.slice().pop()?.hospitalOccupancy ?? 0) * 100}
          </TimelineWidget.Value>
          <TimelineWidget.LineChart color={COLORS.yellow.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-yellow-100 text-yellow-900"
          data={timeline}
          dataKey="hospitalized"
          days={interval}
        >
          <TimelineWidget.Value
            calculateDelta
            showDelta
            label={
              <FormattedMessage
                id="common.hospitalized"
                defaultMessage="Spital (ohne Intensiv)"
              />
            }
          >
            {generalData.hospitalized}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.yellow.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-green-100 text-green-900"
          data={timeline}
          dataKey="recoveredPerDay"
          days={interval}
        >
          <TimelineWidget.Value
            showDelta
            label={
              <FormattedMessage
                id="common.recovered"
                defaultMessage="Genesen"
              />
            }
          >
            {recovered}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.green.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-gray-100 text-gray-900"
          data={timeline}
          dataKey="deathsPerDay"
          days={interval}
        >
          <TimelineWidget.Value
            showDelta
            label={
              <FormattedMessage
                id="common.deaths"
                defaultMessage="Todesfälle"
              />
            }
          >
            {deaths}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.gray.dark} />
        </TimelineWidget>
      </div>
    </div>
  );
}

function Dashboard({ generalData, timeline, versionData }: DataProps) {
  const recovered = timeline.reduce((acc, v) => v.recoveredPerDay + acc, 0);
  const deaths = timeline.reduce((acc, v) => v.deathsPerDay + acc, 0);

  return (
    <div>
      <GeneralDataWidgets
        deaths={deaths}
        recovered={recovered}
        allCases={generalData.allCases}
        allTests={generalData.allTests}
      />

      <TimelineWidgets
        deaths={deaths}
        recovered={recovered}
        generalData={generalData}
        timeline={timeline}
        versionData={versionData}
      />
    </div>
  );
}

function Home({ generalData, timeline, versionData }: DataProps) {
  return (
    <>
      <Head>
        {(intl) => (
          <title>
            {intl.formatMessage({
              id: "common.dashboard",
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
        <Dashboard
          generalData={generalData}
          timeline={timeline}
          versionData={versionData}
        />
      </div>
      <Footer />
    </>
  );
}

export default function Index({ locale, messages, ...props }: Props) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <Home {...props} />
    </IntlProvider>
  );
}
