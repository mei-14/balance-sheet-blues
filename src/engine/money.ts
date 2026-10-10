/** All money is an integer number of centavos. Never use floats for currency. */
export type Centavos = number;

export function isCentavos(v: unknown): v is Centavos {
  return typeof v === 'number' && Number.isSafeInteger(v);
}

/** pesos("1,234.56") -> 123456. Also accepts numbers with at most 2 decimals. */
export function pesos(amount: string | number): Centavos {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) throw new Error(`Invalid amount: ${amount}`);
    return Math.round(amount * 100);
  }
  const cleaned = amount.replace(/[₱,\s]/g, '');
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) throw new Error(`Invalid peso amount: "${amount}"`);
  const cents = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0') || '0');
  return m[1] === '-' ? -cents : cents;
}

/** Multiply by a rate in basis points (1200 = 12%), rounding half away from zero. */
export function mulBps(amount: Centavos, bps: number): Centavos {
  if (!isCentavos(amount) || !Number.isInteger(bps)) {
    throw new Error('mulBps needs integer centavos and integer basis points');
  }
  const sign = amount < 0 ? -1 : 1;
  const q = Math.floor((Math.abs(amount) * bps + 5000) / 10000);
  return q === 0 ? 0 : sign * q;
}

export function sum(values: Centavos[]): Centavos {
  return values.reduce((a, b) => a + b, 0);
}

export function formatPeso(amount: Centavos): string {
  const abs = Math.abs(amount);
  const whole = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cents = (abs % 100).toString().padStart(2, '0');
  return `${amount < 0 ? '-' : ''}₱${whole}.${cents}`;
}