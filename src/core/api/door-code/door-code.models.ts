export type DoorCodeCurrent = {
  id: string;
  code: string;
  effective_from: string;
  set_by: string | null;
};

export type DoorCodeRotatePayload = {
  code: string;
};

export type DoorCodeRotateResponse = DoorCodeCurrent & {
  notified_count: number;
};

export function normalizeDoorCodeCurrent(raw: DoorCodeCurrent): DoorCodeCurrent {
  return {
    id: raw.id,
    code: raw.code,
    effective_from: raw.effective_from,
    set_by: raw.set_by ?? null,
  };
}

export function normalizeDoorCodeRotateResponse(raw: DoorCodeRotateResponse): DoorCodeRotateResponse {
  return {
    ...normalizeDoorCodeCurrent(raw),
    notified_count: raw.notified_count,
  };
}
