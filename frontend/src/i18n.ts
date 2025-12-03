import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is defined
  const validLocale = locale || 'en';
  return {
    messages: (await import(`../messages/${validLocale}.json`)).default
  };
});

