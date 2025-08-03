import { v4 as uuidv4 } from "uuid";

/**
 * Returns current date and time in ISO 8601 format.
 * @returns - Current date and time in ISO 8601 format.
 */
export function getIsoDateTime(): string {
  return new Date().toISOString();
}

/**
 *
 * @param macAddress Optional MAC address of the device.
 * @returns Unique device identifier.
 */
export function generateDeviceId(macAddress?: string): string {
  if (macAddress) {
    const cleanMac = macAddress.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    return `${cleanMac}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `HUB-${uuidv4().substring(0, 8).toUpperCase()}`;
}
