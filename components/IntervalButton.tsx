import React from "react";
import classNames from "classnames";
import { atom, useAtom } from "jotai";
import { FormattedMessage } from "react-intl";

type Interval = 14 | 30 | 60;

type IntervalButtonProps = {
  interval: Interval;
};

export const intervalAtom = atom<Interval>(14);

export default function IntervalButton({ interval }: IntervalButtonProps) {
  const [currentInterval, setInterval] = useAtom(intervalAtom);

  return (
    <button
      className={classNames(
        "focus:outline-none focus:shadow-outline rounded px-2 py-1 text-gray-600",
        {
          "hover:bg-gray-100": currentInterval !== interval,
          "bg-gray-200": currentInterval === interval,
        }
      )}
      onClick={() => setInterval(interval)}
    >
      <FormattedMessage
        id="common.x_days"
        defaultMessage="{x} Tage"
        values={{
          x: interval,
        }}
      />
    </button>
  );
}
