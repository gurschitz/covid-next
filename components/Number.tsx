import { formatNumber } from "../helpers/formatters";

type NumberProps = {
  children: number | bigint;
  precision?: number;
  unit?: string;
};

export default function Number({ children, unit, precision }: NumberProps) {
  return (
    <>
      {formatNumber(children, precision)}
      {unit}
    </>
  );
}
