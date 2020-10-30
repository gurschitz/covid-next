import Link from "next/link";
import { IntlProvider } from "react-intl";
import Header from "../components/Header";
import getMessages from "../helpers/getMessages";

type Props = {
  locale: string;
  messages: any;
};
export async function getStaticProps({ locale }): Promise<{ props: Props }> {
  const messages = await getMessages(locale);

  return {
    props: {
      locale,
      messages,
    },
  };
}

export default function Imprint({ locale, messages }: Props) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <div className="container mx-auto">
        <Header />

        <div className="py-4">
          <Link href="/">
            <a className="text-blue-500">Zurück zum Dashboard</a>
          </Link>
        </div>

        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-bold">Medieninhaber</h2>
            Gerald Urschitz
          </div>
          <div>
            <h2 className="text-xl font-bold">Wohnort</h2>
            1170 Wien
          </div>
          <div>
            <h2 className="text-xl font-bold">Ausrichtung</h2>
            Visuelle Datenaufbereitung zu COVID-19
          </div>
          <div>
            <h2 className="text-xl font-bold">Kontakt</h2>
            <div>
              <span>Twitter:</span>{" "}
              <a
                className="text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                href="https://twitter.com/GeraldUrschitz"
              >
                @gurschitz
              </a>
            </div>
            <div>
              <span>E-Mail:</span>{" "}
              <a
                className="text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                href="mailto:gerald.urschitz@gmail.com"
              >
                gerald.urschitz@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </IntlProvider>
  );
}
