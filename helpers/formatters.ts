import { parseISO } from "date-fns";
import { format } from "date-fns-tz";
import { de, enUS } from "date-fns/locale";
import { useIntl } from "react-intl";
import { useLocale } from "../components/IntlProvider";
import { TIME_ZONE as timeZone } from "../helpers/constants";

export function useNumberFormatter(precision = 0) {
  const intl = useIntl();
  return function format(value: number | bigint) {
    return intl.formatNumber(value, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };
}

export function useDateFormatter() {
  const locale = useLocale();

  function formatDate(date: Date, formatString: string) {
    return format(date, formatString, {
      locale: locale === "en" ? enUS : de,
      timeZone,
    });
  }

  return formatDate;
}

export function parseAndFormatDate(
  day: string,
  dateFormat: string,
  locale: string
) {
  return format(parseISO(day), dateFormat, {
    locale: locale === "en" ? enUS : de,
    timeZone,
  });
}
