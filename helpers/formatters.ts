import { LOCALE } from "./constants";

export function formatNumber(value: number | bigint, precision = undefined) {
  return Intl.NumberFormat(LOCALE, { maximumFractionDigits: precision }).format(
    value
  );
}
