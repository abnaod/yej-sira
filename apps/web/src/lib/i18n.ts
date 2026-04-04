import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import am from "@ys/intl/locales/am/common.json";
import en from "@ys/intl/locales/en/common.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    am: { common: am },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common"],
  interpolation: { escapeValue: false },
});

export default i18n;
