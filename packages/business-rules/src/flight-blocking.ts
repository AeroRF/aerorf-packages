export type FlightBlockReason =
  | 'CVA_INVALID'
  | 'CA_INVALID'
  | 'OPEN_WORKORDER'
  | 'PILOT_DOC_EXPIRED';

export interface FlightBlockInput {
  cvaValid: boolean;
  caApplicable: boolean;
  caValid: boolean;
  hasOpenWorkorder: boolean;
  pilotDocExpired: boolean;
}

export interface FlightBlockResult {
  blocked: boolean;
  reasons: FlightBlockReason[];
}

export function evaluateFlightBlock(input: FlightBlockInput): FlightBlockResult {
  const reasons: FlightBlockReason[] = [];

  if (!input.cvaValid) reasons.push('CVA_INVALID');
  if (input.caApplicable && !input.caValid) reasons.push('CA_INVALID');
  if (input.hasOpenWorkorder) reasons.push('OPEN_WORKORDER');
  if (input.pilotDocExpired) reasons.push('PILOT_DOC_EXPIRED');

  return { blocked: reasons.length > 0, reasons };
}

export function componentOverdueAlertsOnly(): boolean {
  return true;
}
