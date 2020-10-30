import { createContext, useContext, useEffect } from "react";
import { createIntl, RawIntlProvider, IntlConfig } from "react-intl";

interface ContextProps {
  locale: string;
}

const LocaleContext = createContext<ContextProps>({ locale: "de" });

export const useLocale = () => useContext<ContextProps>(LocaleContext).locale;

export const IntlProvider: React.FC<Pick<
  IntlConfig,
  "locale" | "messages"
>> = ({ children, locale, messages }) => {
  return (
    <LocaleContext.Provider value={{ locale }}>
      <RawIntlProvider value={createIntl({ locale, messages })}>
        {children}
      </RawIntlProvider>
    </LocaleContext.Provider>
  );
};

export default IntlProvider;
