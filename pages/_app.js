import { AuthProvider } from "provider/auth";
import { DBProvider } from "provider/db";

// Components
import "@css/globals.css";
import "@css/components/buttons.css";
import "@css/components/dropdowns.css";
import "@css/components/icons.css";
import "@css/components/inputs.css";
import "@css/components/products.css";
import "@css/components/sliders.css";
import "@css/components/spinners.css";
import "@css/components/toasts.css";
import "@css/components/chips.css";
import "@css/components/selects.css";
import "@css/components/alerts.css";
import "@css/components/editor.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <DBProvider>
        <AuthProvider>
          <Component {...pageProps} />
          <div id="notifications"></div>
        </AuthProvider>
      </DBProvider>
    </>
  );
}

export default MyApp;
