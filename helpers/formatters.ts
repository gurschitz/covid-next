import { createIntl, createIntlCache } from "@formatjs/intl";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";
import { de as locale } from "date-fns/locale";
import { TIME_ZONE as timeZone } from "../helpers/constants";

const cache = createIntlCache();

const intl = createIntl(
  {
    locale: "de-DE",
    messages: {},
  },
  cache
);

export function formatNumber(value: number | bigint, precision?: number) {
  return intl.formatNumber(value, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function parseAndFormatDate(day: string, dateFormat: string) {
  return format(parseISO(day), dateFormat, {
    locale,
    timeZone,
  });
}
