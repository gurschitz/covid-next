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
import { WidgetIntervalButton } from "../components/IntervalButtons";
import { FormattedMessage } from "react-intl";
import getMessages from "../helpers/getMessages";
import { useDateFormatter, useNumberFormatter } from "../helpers/formatters";
import IntlProvider from "../components/IntlProvider";
import Head from "../components/Head";
import { HealthMinistryData } from "../helpers/fetchHealthMinistryData";
import { isSameDay, parseISO } from "date-fns";
import { widgetIntervalAtom } from "../atoms/interval";
import { formatDateToParts } from "@formatjs/intl";

type DataProps = {
  timeline: TimelineRow[];
  versionData: VersionData;
  healthMinistryData: HealthMinistryData;
  generalData: GeneralData;
};

type IntlProps = {
  locale: string;
  messages: any;
};

type Props = DataProps & IntlProps;

export async function getStaticProps({ locale }): Promise<{ props: Props }> {
  const versionData = await dataApi.fetchVersionData();
  const timeline = await dataApi.fetchTimeline();
  const messages = await getMessages(locale);
  const healthMinistryData = await dataApi.fetchHealthMinistryData();
  const generalData = await dataApi.fetchGeneralData();

  return {
    props: {
      timeline,
      versionData,
      locale,
      messages,
      healthMinistryData,
      generalData,
    },
  };
}

type GeneralDataWidgetsProps = {
  allTests: number;
  deaths: number;
  recovered: number;
  healthMinistryData: HealthMinistryData;
  generalData: GeneralData;
  versionData: VersionData;
};
function GeneralDataWidgets({
  allTests,
  generalData,
  deaths,
  recovered,
  healthMinistryData,
  versionData,
}: GeneralDataWidgetsProps) {
  const formatDate = useDateFormatter();
  const allCasesNew = generalData.allCases;
  const allCases = healthMinistryData.confirmedCases.total;
  const from = parseISO(
    healthMinistryData.confirmedCases.timestamp ?? versionData.versionDate
  );
  const to = parseISO(generalData.lastUpdated);
  const activeCases = allCases - recovered - deaths;

  const showDay = !isSameDay(to, from);
  const dateFormat = showDay ? "dd.MM. HH:mm" : "HH:mm";
  return (
    <div className="grid lg:grid-cols-4 gap-3 px-3 lg:px-4">
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value
          label={
            <FormattedMessage
              id="common.new_cases_timeframe"
              defaultMessage="Neue Fälle im Zeitraum {from}–{to}"
              values={{
                to: formatDate(to, dateFormat),
                from: formatDate(from, dateFormat),
              }}
            />
          }
        >
          <Number>{allCasesNew - allCases}</Number>
        </Widget.Value>
      </Widget>
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
  timeline: TimelineRow[];
  versionData: VersionData;
  healthMinistryData: HealthMinistryData;
  deaths: number;
  recovered: number;
};

function TimelineWidgets({
  timeline,
  versionData,
  deaths,
  recovered,
  healthMinistryData,
}: TimelineWidgetsProps) {
  const formatNumber = useNumberFormatter();
  const formatDate = useDateFormatter();
  const [interval] = useAtom(widgetIntervalAtom);

  const icu = healthMinistryData.icu.total;
  const icuDateTime = healthMinistryData.icu.timestamp
    ? parseISO(healthMinistryData.icu.timestamp)
    : new Date();
  const hospitalized = healthMinistryData.hospitalized.total - icu;
  const hospitalizedDateTime = healthMinistryData.hospitalized.timestamp
    ? parseISO(healthMinistryData.hospitalized.timestamp)
    : new Date();

  console.log(healthMinistryData);
  return (
    <div className="py-3 px-3 lg:px-4">
      <div className="flex justify-center lg:justify-end items-center space-x-4 w-full pt-4 pb-3">
        <WidgetIntervalButton interval={14} />
        <WidgetIntervalButton interval={30} />
        <WidgetIntervalButton interval={60} />
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
          timeline={timeline}
          versionData={versionData}
          days={interval}
        />

        <TimelineWidget
          className="bg-blue-100 text-blue-900"
          data={timeline.map((v) => ({
            ...v,
            positivityRate: v.positivityRate * 100,
          }))}
          unit="%"
          dataKey="positivityRate"
          days={interval}
          precision={2}
        >
          <TimelineWidget.Value
            label={
              <FormattedMessage
                id="common.positivity_rate"
                defaultMessage="Positivitätsrate"
              />
            }
          >
            {(timeline.slice().pop()?.positivityRate ?? 0) * 100}
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
          precision={2}
        >
          <TimelineWidget.Value
            label={
              <FormattedMessage
                id="common.icu_occupancy_rate"
                defaultMessage="Instensiv Auslastung"
              />
            }
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
              <>
                <FormattedMessage id="common.icu" defaultMessage="Instensiv" />
                <FormattedMessage
                  tagName="div"
                  id="dashboard.cases.new_cases"
                  defaultMessage="Stand: {x}"
                  values={{
                    x: formatDate(icuDateTime, "dd.MM."),
                  }}
                />
              </>
            }
          >
            {icu}
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
          precision={2}
        >
          <TimelineWidget.Value
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
              <>
                <FormattedMessage
                  id="common.hospitalized"
                  defaultMessage="Spital (ohne Intensiv)"
                />
                <FormattedMessage
                  tagName="div"
                  id="dashboard.cases.new_cases"
                  defaultMessage="Stand: {x}"
                  values={{
                    x: formatDate(hospitalizedDateTime, "dd.MM."),
                  }}
                />
              </>
            }
          >
            {hospitalized}
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

function Dashboard({
  timeline,
  versionData,
  healthMinistryData,
  generalData,
}: DataProps) {
  const recovered = timeline.reduce((acc, v) => v.recoveredPerDay + acc, 0);
  const deaths = timeline.reduce((acc, v) => v.deathsPerDay + acc, 0);
  const allTests = timeline.slice().pop()?.tests ?? 0;

  return (
    <div>
      <GeneralDataWidgets
        deaths={deaths}
        recovered={recovered}
        allTests={allTests}
        generalData={generalData}
        versionData={versionData}
        healthMinistryData={healthMinistryData}
      />

      <TimelineWidgets
        deaths={deaths}
        recovered={recovered}
        timeline={timeline}
        versionData={versionData}
        healthMinistryData={healthMinistryData}
      />
    </div>
  );
}

function Home({
  timeline,
  versionData,
  healthMinistryData,
  generalData,
}: DataProps) {
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
      <Header lastUpdated={versionData.creationDate} />
      <div className="container mx-auto py-4">
        <Dashboard
          generalData={generalData}
          timeline={timeline}
          versionData={versionData}
          healthMinistryData={healthMinistryData}
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
