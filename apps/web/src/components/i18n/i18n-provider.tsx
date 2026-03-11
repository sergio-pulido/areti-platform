"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LOCALE_COOKIE_NAME, normalizeLocale, type AppLocale } from "@/lib/i18n/config";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

type I18nProviderProps = {
  children: ReactNode;
  initialLocale: AppLocale;
};

type TranslationDictionary = Record<string, string>;

const LocaleContext = createContext<LocaleContextValue | null>(null);

const TRANSLATABLE_ATTRIBUTES = ["aria-label", "placeholder", "title", "alt"] as const;
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);

const MANUAL_SPANISH_OVERRIDES: TranslationDictionary = {
  Actions: "Acciones",
  Personal: "Personal",
  Overview: "Resumen",
  Library: "Biblioteca",
  Practices: "Prácticas",
  Journal: "Diario",
  Reflections: "Reflexiones",
  Academy: "Academia",
  Traditions: "Tradiciones",
  Thinkers: "Pensadores",
  Works: "Obras",
  Concepts: "Conceptos",
  Paths: "Rutas",
  Search: "Buscar",
  Companion: "Companion",
  Conversations: "Conversaciones",
  Community: "Comunidad",
  Circles: "Círculos",
  Challenges: "Desafíos",
  Resources: "Recursos",
  Experts: "Expertos",
  Events: "Eventos",
  Creator: "Creador",
  Exercises: "Ejercicios",
  Readings: "Lecturas",
  Videos: "Videos",
  Profile: "Perfil",
  Preferences: "Preferencias",
  Notifications: "Notificaciones",
  Security: "Seguridad",
  Subscription: "Suscripción",
  Privacy: "Privacidad",
  Dashboard: "Panel",
  "Open all paths": "Abrir todas las rutas",
  "Reflective Companion": "Companion reflexivo",
  "Begin where you are": "Empieza donde estás",
  "Today for you": "Hoy para ti",
  "Start your path": "Inicia tu ruta",
  "Continue your path": "Continúa tu ruta",
  "Recent reflections": "Reflexiones recientes",
  "No reflections yet. Start with one short check-in and your home will personalize.":
    "Aún no hay reflexiones. Empieza con una revisión breve y tu inicio se personalizará.",
  "Momentum checkpoint": "Punto de control de impulso",
  "Create a new conversation thread": "Crear un nuevo hilo de conversación",
  "Open thread actions": "Abrir acciones del hilo",
  Rename: "Renombrar",
  Save: "Guardar",
  Archive: "Archivar",
  Restore: "Restaurar",
  Close: "Cerrar",
  "Summarize now": "Resumir ahora",
  "Open context usage details": "Abrir detalles del uso de contexto",
  "Context usage (estimated)": "Uso de contexto (estimado)",
  "State: Healthy": "Estado: Saludable",
  "State: Warning": "Estado: Advertencia",
  "State: Degraded": "Estado: Degradado",
  Areti: "Areti",
  "Ask Companion": "Preguntar a Companion",
  "Auto summarize": "Resumen automático",
  "All thinkers": "Todos los pensadores",
  "All works": "Todas las obras",
  "A short practice": "Una práctica corta",
  "A lesson": "Una lección",
  "Read all": "Marcar todo como leído",
  "New Entry": "Nueva entrada",
  "Quick Actions": "Acciones rápidas",
  Logout: "Cerrar sesión",
  Account: "Cuenta",
  Sections: "Secciones",
  Legal: "Legal",
  "Privacy Policy": "Política de privacidad",
  Terms: "Términos",
  "No notifications yet.": "Aún no tienes notificaciones.",
  "Mark read": "Marcar como leída",
  "Open user menu": "Abrir menú de usuario",
  "Open mobile navigation": "Abrir navegación móvil",
  "Open account section": "Abrir sección de cuenta",
  "Open creator section": "Abrir sección de creador",
  "Open community section": "Abrir sección de comunidad",
  "Open dashboard section": "Abrir sección de panel",
  "Open academy section": "Abrir sección de academia",
  "Open companion section": "Abrir sección de companion",
};

function writeLocaleCookie(locale: AppLocale): void {
  const oneYearInSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
}

function splitEdges(value: string): { leading: string; core: string; trailing: string } {
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return {
    leading: match?.[1] ?? "",
    core: match?.[2] ?? value,
    trailing: match?.[3] ?? "",
  };
}

function shouldSkipElement(element: Element): boolean {
  if (SKIPPED_TAGS.has(element.tagName)) {
    return true;
  }

  return Boolean(element.closest("[data-i18n-ignore='true']"));
}

function applyTranslation(value: string, locale: AppLocale, dictionary: TranslationDictionary): string {
  if (locale !== "es") {
    return value;
  }

  const exact = dictionary[value];
  if (exact) {
    return exact;
  }

  const openSectionMatch = value.match(/^Open (.+) section$/i);
  if (openSectionMatch?.[1]) {
    return `Abrir sección de ${openSectionMatch[1]}`;
  }

  const queryMatch = value.match(/^Query:\s*(.+)$/i);
  if (queryMatch?.[1]) {
    return `Consulta: ${queryMatch[1]}`;
  }

  return value;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const [dictionary, setDictionary] = useState<TranslationDictionary>(MANUAL_SPANISH_OVERRIDES);
  const textOriginalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const attrOriginalsRef = useRef<WeakMap<Element, Map<string, string>>>(new WeakMap());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    document.documentElement.lang = normalized;
    writeLocaleCookie(normalized);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    let active = true;

    if (locale !== "es") {
      setDictionary(MANUAL_SPANISH_OVERRIDES);
      return () => {
        active = false;
      };
    }

    import("@/lib/i18n/es-dictionary.json")
      .then((module) => {
        if (!active) {
          return;
        }

        setDictionary({
          ...module.default,
          ...MANUAL_SPANISH_OVERRIDES,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setDictionary(MANUAL_SPANISH_OVERRIDES);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const textOriginals = textOriginalsRef.current;
    const attrOriginals = attrOriginalsRef.current;

    const translateTextNode = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || shouldSkipElement(parent)) {
        return;
      }

      const original = textOriginals.get(node) ?? node.nodeValue ?? "";
      if (!textOriginals.has(node)) {
        textOriginals.set(node, original);
      }

      const { leading, core, trailing } = splitEdges(original);
      if (core.length === 0) {
        return;
      }

      const translated = applyTranslation(core, locale, dictionary);
      const next = `${leading}${translated}${trailing}`;

      if (node.nodeValue !== next) {
        node.nodeValue = next;
      }
    };

    const translateElementAttributes = (element: Element) => {
      if (shouldSkipElement(element)) {
        return;
      }

      let originalMap = attrOriginals.get(element);
      if (!originalMap) {
        originalMap = new Map();
        attrOriginals.set(element, originalMap);
      }

      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        const value = element.getAttribute(attribute);
        if (value === null || value.trim().length === 0) {
          continue;
        }

        if (!originalMap.has(attribute)) {
          originalMap.set(attribute, value);
        }

        const original = originalMap.get(attribute) ?? value;
        const translated = applyTranslation(original, locale, dictionary);

        if (element.getAttribute(attribute) !== translated) {
          element.setAttribute(attribute, translated);
        }
      }

      if (element instanceof HTMLInputElement) {
        if (element.type === "button" || element.type === "submit" || element.type === "reset") {
          const value = element.value;

          if (value.trim().length > 0) {
            const valueKey = "__value__";
            if (!originalMap.has(valueKey)) {
              originalMap.set(valueKey, value);
            }

            const original = originalMap.get(valueKey) ?? value;
            const translated = applyTranslation(original, locale, dictionary);

            if (element.value !== translated) {
              element.value = translated;
            }
          }
        }
      }
    };

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        translateTextNode(node as Text);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const element = node as Element;
      translateElementAttributes(element);

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const current = walker.currentNode;
        if (current.nodeType === Node.TEXT_NODE) {
          translateTextNode(current as Text);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          translateElementAttributes(current as Element);
        }
      }
    };

    processNode(document.body);

    if (locale !== "es") {
      textOriginalsRef.current = new WeakMap();
      attrOriginalsRef.current = new WeakMap();
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          if (mutation.target.nodeType === Node.TEXT_NODE) {
            translateTextNode(mutation.target as Text);
          }
          continue;
        }

        mutation.addedNodes.forEach((node) => processNode(node));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [dictionary, locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within I18nProvider.");
  }

  return context;
}
