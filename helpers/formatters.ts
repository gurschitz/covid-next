import { LOCALE } from "./constants";
import { createIntl, createIntlCache } from "@formatjs/intl";

// This is optional but highly recommended
// since it prevents memory leak
const cache = createIntlCache();

const intl = createIntl(
  {
    locale: "de-DE",
    messages: {},
  },
  cache
);

export function formatNumber(value: number | bigint, precision = undefined) {
  return intl.formatNumber(value);
}
