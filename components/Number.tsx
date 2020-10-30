import { useNumberFormatter } from "../helpers/formatters";

type NumberProps = {
  children: number | bigint;
  precision?: number;
  unit?: string;
};

export default function Number({ children, unit, precision }: NumberProps) {
  const formatNumber = useNumberFormatter(precision);

  return (
    <>
      {formatNumber(children)}
      {unit}
    </>
  );
}
