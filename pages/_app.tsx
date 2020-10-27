import "../styles/tailwind.css";
import { Provider } from "jotai";

export default function MyApp({ Component, pageProps }) {
  return (
    <Provider>
      <Component {...pageProps} />
    </Provider>
  );
}
