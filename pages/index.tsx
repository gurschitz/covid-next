import React from "react";
import dataApi from "../helpers/dataApi";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { COLORS } from "../helpers/constants";
import Number from "../components/Number";
import Widget from "../components/Widget";
import TimelineWidget from "../components/CurrentValueWithHistory";
import NewInfections from "../components/NewInfections";

export async function getStaticProps(context) {
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

function GeneralData({ generalData, deaths, recovered }) {
  const activeCases = generalData.allInfections - recovered - deaths;

  return (
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
  );
}

function TimelineWidgets({
  generalData,
  timeline,
  versionData,
  deaths,
  recovered,
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-3 py-3 px-3 lg:px-4">
      <NewInfections
        generalData={generalData}
        timeline={timeline}
        versionData={versionData}
        days={14}
      />

      <TimelineWidget
        className="bg-blue-100 text-blue-900"
        data={timeline}
        days={14}
        dataKey="testsPerDay"
      >
        <TimelineWidget.Value label="Ø Testungen (7-Tage-Mittel)">
          {timeline.slice().pop().sevenDayAvgTests}
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
        days={14}
      >
        <TimelineWidget.Value precision={2} label="Positivitätsrate">
          {timeline.slice(-2, -1).pop().positivityRate * 100}
        </TimelineWidget.Value>
        <TimelineWidget.LineChart color={COLORS.blue.dark} />
      </TimelineWidget>

      <TimelineWidget
        className="bg-blue-100 text-blue-900"
        data={timeline}
        dataKey="sevenDay"
        days={14}
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
        days={14}
        unit="%"
      >
        <TimelineWidget.Value label="Intensiv Auslastung" precision={2}>
          {timeline.slice().pop().icuOccupancy * 100}
        </TimelineWidget.Value>
        <TimelineWidget.LineChart color={COLORS.red.dark} />
      </TimelineWidget>

      <TimelineWidget
        className="bg-red-100 text-red-900"
        data={timeline}
        dataKey="icu"
        days={14}
      >
        <TimelineWidget.Value label="Intensiv">
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
        days={14}
        unit="%"
      >
        <TimelineWidget.Value
          precision={2}
          label="Spital Auslastung (ohne Intensiv)"
        >
          {timeline.slice().pop().hospitalOccupancy * 100}
        </TimelineWidget.Value>
        <TimelineWidget.BarChart color={COLORS.yellow.dark} />
      </TimelineWidget>

      <TimelineWidget
        className="bg-yellow-100 text-yellow-900"
        data={timeline}
        dataKey="hospitalized"
        days={14}
      >
        <TimelineWidget.Value label="Spital (ohne Intensiv)">
          {generalData.hospitalized}
        </TimelineWidget.Value>
        <TimelineWidget.BarChart color={COLORS.yellow.dark} />
      </TimelineWidget>

      <TimelineWidget
        className="bg-green-100 text-green-900"
        data={timeline}
        dataKey="hospitalized"
        days={14}
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
        days={14}
      >
        <TimelineWidget.Value showDelta label="Todesfälle">
          {deaths}
        </TimelineWidget.Value>
        <TimelineWidget.BarChart color={COLORS.gray.dark} />
      </TimelineWidget>
    </div>
  );
}

function Dashboard({ generalData, timeline, versionData }) {
  const recovered = timeline.reduce((acc, v) => v.recoveredPerDay + acc, 0);
  const deaths = timeline.reduce((acc, v) => v.deathsPerDay + acc, 0);

  return (
    <div>
      <GeneralData
        deaths={deaths}
        recovered={recovered}
        generalData={generalData}
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

export default function Home({ generalData, timeline, versionData }) {
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
