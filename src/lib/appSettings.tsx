import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'kd.app.v1';

/** ISO 4217 codes supported for display (PKR included). */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type AppSettingsV1 = { currency: SupportedCurrency };

function isSupportedCurrency(s: string): s is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(s);
}

function load(): AppSettingsV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { currency: 'USD' };
    const p = JSON.parse(raw) as { currency?: string };
    if (typeof p?.currency === 'string' && isSupportedCurrency(p.currency)) {
      return { currency: p.currency };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { currency: 'USD' };
}

function save(s: AppSettingsV1) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

const LOCALE_BY_CURRENCY: Record<SupportedCurrency, string> = {
  USD: 'en-US',
  EUR: 'en-US',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  /** Prefer Urdu-Pakistan locale so amounts typically show as Rs. with PKR. */
  PKR: 'ur-PK',
};

/**
 * Safe currency formatting: uses Intl; on failure falls back so the UI never throws.
 */
export function formatCurrencyAmount(
  amount: number,
  currency: SupportedCurrency,
  overrides?: Intl.NumberFormatOptions
): string {
  const locale = LOCALE_BY_CURRENCY[currency] ?? 'en-US';
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...overrides,
    }).format(n);
  } catch {
    const digits = overrides?.maximumFractionDigits ?? 2;
    const minDigits = overrides?.minimumFractionDigits ?? digits;
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: minDigits, maximumFractionDigits: digits })}`;
  }
}

type Ctx = {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  formatMoney: (amount: number, overrides?: Intl.NumberFormatOptions) => string;
};

const AppSettingsContext = createContext<Ctx | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => load().currency);

  useEffect(() => {
    save({ currency });
  }, [currency]);

  const setCurrency = useCallback((c: SupportedCurrency) => {
    setCurrencyState(c);
  }, []);

  const formatMoney = useCallback(
    (amount: number, overrides?: Intl.NumberFormatOptions) => formatCurrencyAmount(amount, currency, overrides),
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatMoney,
    }),
    [currency, setCurrency, formatMoney]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): Ctx {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
