import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const LOCALE_BY_CURRENCY: Record<SupportedCurrency, string> = {
  USD: 'en-US',
  EUR: 'en-US',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  PKR: 'ur-PK',
};

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
  const [currency, setCurrencyState] = useState<SupportedCurrency>('PKR');

  const setCurrency = useCallback((c: SupportedCurrency) => {
    setCurrencyState(c);
  }, []);

  const formatMoney = useCallback(
    (amount: number, overrides?: Intl.NumberFormatOptions) => formatCurrencyAmount(amount, currency, overrides),
    [currency]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, formatMoney }),
    [currency, setCurrency, formatMoney]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): Ctx {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
