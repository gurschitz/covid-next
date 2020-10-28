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
import NewInfections from "../components/NewInfections";
import { useAtom } from "jotai";
import IntervalButton, { intervalAtom } from "../components/IntervalButton";

type DataProps = {
  generalData: GeneralData;
  timeline: TimelineRow[];
  versionData: VersionData;
};

export async function getStaticProps(): Promise<{ props: DataProps }> {
  const generalData = await dataApi.fetchGeneralData();
  const versionData = await dataApi.fetchVersionData();
  const timeline = await dataApi.fetchTimeline();

  return {
    props: {
      generalData,
      timeline,
      versionData,
    },
  };
}

function GeneralDataWidgets({ allTests, deaths, recovered, allCases }) {
  const activeCases = allCases - recovered - deaths;

  return (
    <div className="grid lg:grid-cols-3 gap-3 px-3 lg:px-4">
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value label="positiv getestet">
          <Number>{allCases}</Number>
        </Widget.Value>
      </Widget>
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value label="aktive Fälle">
          <Number>{activeCases}</Number>
        </Widget.Value>
      </Widget>
      <Widget className="bg-gray-200 text-gray-900">
        <Widget.Value label="Testungen gesamt">
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
  const [interval] = useAtom(intervalAtom);

  return (
    <div className="py-3 px-3 lg:px-4">
      <div className="flex justify-end items-center space-x-4 w-full pt-4 pb-3">
        <IntervalButton interval={14} />
        <IntervalButton interval={30} />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <NewInfections
          allCases={generalData.allCases}
          timeline={timeline}
          versionData={versionData}
          days={interval}
        />

        <TimelineWidget
          className="bg-blue-100 text-blue-900"
          data={timeline}
          days={interval}
          dataKey="testsPerDay"
        >
          <TimelineWidget.Value label="Ø Testungen (7-Tage-Mittel)">
            {timeline.slice().pop()?.sevenDayAvgTests ?? 0}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.blue.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-blue-100 text-blue-900"
          data={timeline.map((v, i) => ({
            ...v,
            positivityRate: (v.positivityRate * 100).toFixed(2),
            className: i === timeline.length - 1 ? "opacity-50" : undefined,
          }))}
          unit="%"
          dataKey="positivityRate"
          days={interval}
        >
          <TimelineWidget.Value precision={2} label="Positivitätsrate">
            {(timeline.slice(-2, -1).pop()?.positivityRate ?? 0) * 100}
          </TimelineWidget.Value>
          <TimelineWidget.LineChart color={COLORS.blue.dark} />
        </TimelineWidget>

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
                <div>7-Tage-Inzidenz</div>
                <div>(pro 100.000 Einwohner)</div>
              </>
            }
          >
            {timeline[timeline.length - 1].sevenDay}
          </TimelineWidget.Value>
          <TimelineWidget.LineChart color={COLORS.blue.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-red-100 text-red-900"
          data={timeline.map((v) => ({
            ...v,
            icuOccupancy: (v.icuOccupancy * 100).toFixed(2),
          }))}
          dataKey="icuOccupancy"
          days={interval}
          unit="%"
        >
          <TimelineWidget.Value label="Intensiv Auslastung" precision={2}>
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
          <TimelineWidget.Value calculateDelta showDelta label="Intensiv">
            {generalData.icu}
          </TimelineWidget.Value>
          <TimelineWidget.BarChart color={COLORS.red.dark} />
        </TimelineWidget>

        <TimelineWidget
          className="bg-yellow-100 text-yellow-900"
          data={timeline.map((v) => ({
            ...v,
            hospitalOccupancy: (v.hospitalOccupancy * 100).toFixed(2),
          }))}
          dataKey="hospitalOccupancy"
          days={interval}
          unit="%"
        >
          <TimelineWidget.Value
            precision={2}
            label="Spital Auslastung (ohne Intensiv)"
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
            label="Spital (ohne Intensiv)"
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
          <TimelineWidget.Value showDelta label="Genesen">
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
          <TimelineWidget.Value showDelta label="Todesfälle">
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

export default function Home({
  generalData,
  timeline,
  versionData,
}: DataProps) {
  return (
    <div className="container mx-auto">
      <Header lastUpdated={generalData.lastUpdated} />
      <Dashboard
        generalData={generalData}
        timeline={timeline}
        versionData={versionData}
      />
      <Footer />
    </div>
  );
}
