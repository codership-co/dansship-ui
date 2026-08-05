export type WalletEntryType = 'credit' | 'debit';

export type WalletEntrySource = 'manual' | 'checkout_apply' | 'checkout_reversal';

export interface WalletLedgerEntry {
  id: string;
  user_id: string;
  entry_type: WalletEntryType;
  amount: number;
  note: string;
  source: WalletEntrySource;
  payment_intent_id: string | null;
  created_by: string | null;
  created_at: string;
  running_balance: number;
}

export interface WalletResponse {
  user_id: string;
  balance: number;
  entries: Array<WalletLedgerEntry>;
}

export interface CreateWalletEntryPayload {
  entry_type: WalletEntryType;
  amount: number;
  note: string;
  payment_intent_id?: string;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') return value;

  return Number(value) || 0;
}

export function normalizeWallet(data: WalletResponse): WalletResponse {
  return {
    ...data,
    balance: toNumber(data.balance as unknown as string),
    entries: (data.entries ?? []).map(entry => ({
      ...entry,
      amount: toNumber(entry.amount as unknown as string),
      running_balance: toNumber(entry.running_balance as unknown as string),
    })),
  };
}
