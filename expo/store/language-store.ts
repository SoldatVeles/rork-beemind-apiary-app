import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import * as Localization from "expo-localization";
import { translations, SUPPORTED_LANGUAGES, type Language } from "@/constants/translations";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth-store";

export type { Language };

const LANGUAGE_STORAGE_KEY = "@beemind_language";

function isSupportedLanguage(value: string | null | undefined): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

function detectDeviceLanguage(): Language {
  try {
    const locales = Localization.getLocales();
    for (const loc of locales) {
      const code = (loc.languageCode ?? "").toLowerCase();
      if (isSupportedLanguage(code)) return code;
    }
  } catch (e) {
    console.log("[Language] device locale detection failed", e);
  }
  return "en";
}

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hydratedRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("[Language] Load timeout, using default");
      setIsLoading(false);
    }, 3000);

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        clearTimeout(timeout);
        if (isSupportedLanguage(stored)) {
          setLanguageState(stored);
        } else {
          setLanguageState(detectDeviceLanguage());
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error("[Language] Failed to load language:", error);
      } finally {
        hydratedRef.current = true;
        setIsLoading(false);
      }
    })();
  }, []);

  // When user signs in, prefer remote preference if available; otherwise push local.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!user?.id) {
      lastUserIdRef.current = null;
      return;
    }
    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("language")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) {
          console.log("[Language] read user_preferences failed", error.message);
          return;
        }
        if (data?.language && isSupportedLanguage(data.language)) {
          if (data.language !== language) {
            setLanguageState(data.language);
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, data.language);
          }
        } else {
          await supabase
            .from("user_preferences")
            .upsert(
              { user_id: user.id, language },
              { onConflict: "user_id" },
            );
        }
      } catch (e) {
        console.log("[Language] sync error", e);
      }
    })();
  }, [user?.id, language]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      try {
        setLanguageState(lang);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        if (user?.id) {
          const { error } = await supabase
            .from("user_preferences")
            .upsert(
              { user_id: user.id, language: lang },
              { onConflict: "user_id" },
            );
          if (error) {
            console.log("[Language] upsert language failed", error.message);
          }
        }
      } catch (error) {
        console.error("[Language] Failed to save language:", error);
      }
    },
    [user?.id],
  );

  const t = useMemo(() => translations[language] ?? translations.en, [language]);

  return useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
    }),
    [language, setLanguage, t, isLoading],
  );
});
