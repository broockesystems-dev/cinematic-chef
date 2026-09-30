import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // The business runs on Brasília time (publication schedules, vote deadlines).
    timeZone: "America/Sao_Paulo",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
