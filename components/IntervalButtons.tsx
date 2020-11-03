import React from "react";
import classNames from "classnames";
import { useAtom } from "jotai";
import { FormattedMessage } from "react-intl";
import {
  ChartsInterval,
  chartsIntervalAtom,
  WidgetInterval,
  widgetIntervalAtom,
} from "../atoms/interval";

type IntervalButtonProps = {
  selected: boolean;
  onClick(): void;
  children: React.ReactChild;
};

function IntervalButton({ selected, onClick, children }: IntervalButtonProps) {
  return (
    <button
      className={classNames(
        "focus:outline-none focus:shadow-outline rounded px-2 py-1 text-gray-600",
        {
          "hover:bg-gray-100": !selected,
          "bg-gray-200": selected,
        }
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type ChartsIntervalButtonProps = {
  interval: ChartsInterval;
};

export function ChartsIntervalButton({ interval }: ChartsIntervalButtonProps) {
  const [currentInterval, setInterval] = useAtom(chartsIntervalAtom);

  return (
    <IntervalButton
      selected={currentInterval === interval}
      onClick={() => setInterval(interval)}
    >
      {interval ? (
        <FormattedMessage
          id="common.x_days"
          defaultMessage="{x} Tage"
          values={{
            x: interval,
          }}
        />
      ) : (
        <FormattedMessage
          id="common.total_timefrime"
          defaultMessage="Gesamter Zeitraum"
        />
      )}
    </IntervalButton>
  );
}

type WidgetIntervalButtonProps = {
  interval: WidgetInterval;
};

export function WidgetIntervalButton({ interval }: WidgetIntervalButtonProps) {
  const [currentInterval, setInterval] = useAtom(widgetIntervalAtom);

  return (
    <IntervalButton
      selected={currentInterval === interval}
      onClick={() => setInterval(interval)}
    >
      <FormattedMessage
        id="common.x_days"
        defaultMessage="{x} Tage"
        values={{
          x: interval,
        }}
      />
    </IntervalButton>
  );
}
