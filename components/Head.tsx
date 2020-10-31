import NextHead from "next/head";
import { IntlShape, useIntl } from "react-intl";

type Props = {
  children: (intl: IntlShape) => React.ReactNode;
};
export default function Head({ children }: Props) {
  const intl = useIntl();
  return <NextHead>{children(intl)}</NextHead>;
}
