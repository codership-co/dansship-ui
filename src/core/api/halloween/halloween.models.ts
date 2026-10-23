export interface HalloweenSpinResult {
  outcome: string;
  label_key: string;
  percent: number | null;
  expires_at: string;
  spin_id: string;
  weights: Record<string, number>;
}

export interface HalloweenSpinStatus {
  spun: boolean;
  result: HalloweenSpinResult | null;
}

export interface HalloweenWheelOutcome {
  code: string;
  weight: number;
  label_key: string;
  percent: number | null;
}

export interface HalloweenWheelConfig {
  validity_days: number;
  window_open: boolean;
  outcomes: Array<HalloweenWheelOutcome>;
}
