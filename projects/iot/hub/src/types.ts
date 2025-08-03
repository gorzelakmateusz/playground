export interface Device {
  id: number;
  device_unique_id: string;
  device_type: string;
  device_name: string;
  added_at: string;
  last_communication_at: string;
  firmware_version?: string; // Optional
  location?: string; // Optional
  is_online: 0 | 1; // 0 = offline, 1 = online
}

export interface DeviceError {
  id: number;
  device_unique_id: string;
  error_at: string;
  error_message: string;
  error_code?: string; // Optional
  is_resolved: 0 | 1; // 0 = unresolved, 1 = resolved
}

// Interface for request body for commands sent to devices via HTTP requests.
export interface CommandRequestBody {
  value: 0 | 1;
}

// Typ dla body w requestach do zgłaszania błędów
export interface ErrorReportBody {
  device_unique_id: string;
  error_message: string;
  error_code?: string;
}
