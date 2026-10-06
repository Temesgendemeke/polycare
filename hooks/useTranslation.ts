// Custom hook for translations

import { useUserStore } from '../store';
import { t } from '../i18n/config';

export const useTranslation = () => {
  const { user, appLanguage } = useUserStore();
  const language = user?.preferredLanguage || appLanguage || 'en';

  return {
    t: (key: string, params?: Record<string, string | number>) => t(key, language, params),
    language,
  };
};
