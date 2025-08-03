import Database from "better-sqlite3"; // Importujemy konstruktor Database (domyślny eksport)
import type { Database as DatabaseType } from "better-sqlite3"; // Importujemy TYP Database jako DatabaseType
import logger from "jet-logger";
import { v4 as uuidv4 } from "uuid";
import { Device, DeviceError } from "./types";

let _db: DatabaseType;

export function connectDb() {
  try {
    _db = new Database("database.sqlite", {
      verbose: (message?: any, ...additionalArgs: any[]) => {
        const fullMessage = [message, ...additionalArgs]
          .filter((arg) => arg !== undefined)
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg) : String(arg)
          )
          .join(" ");
        logger.info(fullMessage);
      },
    });
    _db.pragma("journal_mode = WAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_unique_id TEXT UNIQUE NOT NULL,
        device_type TEXT NOT NULL,
        device_name TEXT NOT NULL,
        added_at TEXT NOT NULL,
        last_communication_at TEXT NOT NULL,
        firmware_version TEXT,
        location TEXT,
        is_online INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS device_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_unique_id TEXT NOT NULL,
        error_at TEXT NOT NULL,
        error_message TEXT NOT NULL,
        error_code TEXT,
        is_resolved INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (device_unique_id) REFERENCES devices(device_unique_id)
      );
    `);
    logger.info("Database initialized and tables checked/created.");
  } catch (err: any) {
    logger.err(`Error connecting or initializing database: ${err.message}`);
    process.exit(1);
  }
}

export async function addDevice(
  device_type: string,
  device_name: string,
  mac_address?: string,
  firmware_version?: string,
  location?: string
): Promise<Device | null> {
  const device_unique_id = uuidv4();
  const now = new Date().toISOString();

  try {
    const existingDevice = _db
      .prepare("SELECT * FROM devices WHERE device_name = ?")
      .get(device_name) as Device | undefined;

    if (existingDevice) {
      _db
        .prepare(
          `UPDATE devices SET device_type = ?, device_name = ?, last_communication_at = ?,
           firmware_version = ?, location = ?, is_online = 1 WHERE device_unique_id = ?`
        )
        .run(
          device_type,
          device_name,
          now,
          firmware_version || existingDevice.firmware_version,
          location || existingDevice.location,
          existingDevice.device_unique_id
        );
      logger.info(`Device ${device_name} updated successfully.`);
      return {
        ...existingDevice,
        device_type,
        device_name,
        last_communication_at: now,
        firmware_version,
        location,
        is_online: 1,
      };
    } else {
      _db
        .prepare(
          `INSERT INTO devices (device_unique_id, device_type, device_name, added_at, last_communication_at, firmware_version, location)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          device_unique_id,
          device_type,
          device_name,
          now,
          now,
          firmware_version,
          location
        );
      logger.info(
        `New device ${device_name} added with ID ${device_unique_id}.`
      );
      const result = _db.prepare("SELECT last_insert_rowid() as id").get() as {
        id: number;
      };
      return {
        id: result.id,
        device_unique_id,
        device_type,
        device_name,
        added_at: now,
        last_communication_at: now,
        firmware_version,
        location,
        is_online: 1,
      };
    }
  } catch (error: any) {
    logger.err(`Error in addDevice: ${error.message}`);
    return null;
  }
}

export async function updateLastCommunication(
  device_unique_id: string
): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const result = _db
      .prepare(
        "UPDATE devices SET last_communication_at = ?, is_online = 1 WHERE device_unique_id = ?"
      )
      .run(now, device_unique_id);
    if (result.changes && result.changes > 0) {
      logger.info(`Last communication updated for device: ${device_unique_id}`);
      return true;
    } else {
      logger.warn(
        `Device ${device_unique_id} not found for communication update.`
      );
      return false;
    }
  } catch (error: any) {
    logger.err(`Error in updateLastCommunication: ${error.message}`);
    return false;
  }
}

export async function addDeviceError(
  device_unique_id: string,
  error_message: string,
  error_code?: string
): Promise<DeviceError | null> {
  const now = new Date().toISOString();
  try {
    const deviceExists = _db
      .prepare("SELECT 1 FROM devices WHERE device_unique_id = ?")
      .get(device_unique_id);

    if (!deviceExists) {
      logger.warn(
        `Cannot add error: Device with ID ${device_unique_id} does not exist.`
      );
      return null;
    }

    const result = _db
      .prepare(
        `INSERT INTO device_errors (device_unique_id, error_at, error_message, error_code)
         VALUES (?, ?, ?, ?)`
      )
      .run(device_unique_id, now, error_message, error_code);

    if (result.changes && result.changes > 0) {
      logger.info(
        `Error reported for device ${device_unique_id}: ${error_message}`
      );
      // Jawne typowanie wyniku .get()
      const insertIdResult = _db
        .prepare("SELECT last_insert_rowid() as id")
        .get() as { id: number };
      return {
        id: insertIdResult.id,
        device_unique_id,
        error_at: now,
        error_message,
        error_code,
        is_resolved: 0,
      };
    } else {
      return null;
    }
  } catch (error: any) {
    logger.err(`Error in addDeviceError: ${error.message}`);
    return null;
  }
}

export async function getAllDevices(): Promise<Device[]> {
  try {
    const devices = _db.prepare("SELECT * FROM devices").all() as Device[];
    return devices;
  } catch (error: any) {
    logger.err(`Error in getAllDevices: ${error.message}`);
    return [];
  }
}

export async function getDeviceByUniqueId(
  device_unique_id: string
): Promise<Device | null> {
  try {
    const device = _db
      .prepare("SELECT * FROM devices WHERE device_unique_id = ?")
      .get(device_unique_id) as Device | undefined;
    return device || null;
  } catch (error: any) {
    logger.err(`Error in getDeviceByUniqueId: ${error.message}`);
    return null;
  }
}

export async function getDeviceErrors(
  device_unique_id: string,
  onlyUnresolved: boolean = false
): Promise<DeviceError[]> {
  try {
    let query = "SELECT * FROM device_errors WHERE device_unique_id = ?";
    const params: (string | number)[] = [device_unique_id];

    if (onlyUnresolved) {
      query += " AND is_resolved = 0";
    }

    const errors = _db.prepare(query).all(...params) as DeviceError[];
    return errors;
  } catch (error: any) {
    logger.err(`Error in getDeviceErrors: ${error.message}`);
    return [];
  }
}

export async function setDeviceOffline(
  device_unique_id: string
): Promise<boolean> {
  try {
    const result = _db
      .prepare("UPDATE devices SET is_online = 0 WHERE device_unique_id = ?")
      .run(device_unique_id);
    if (result.changes && result.changes > 0) {
      logger.info(`Device ${device_unique_id} set to offline.`);
      return true;
    } else {
      logger.warn(`Device ${device_unique_id} not found for setting offline.`);
      return false;
    }
  } catch (error: any) {
    logger.err(`Error in setDeviceOffline: ${error.message}`);
    return false;
  }
}
