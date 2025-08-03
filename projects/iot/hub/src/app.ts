import express, { Request, Response } from "express";
import logger from "jet-logger";
import {
  connectDb,
  addDevice,
  updateLastCommunication,
  addDeviceError,
  getAllDevices,
  getDeviceByUniqueId,
  getDeviceErrors,
  setDeviceOffline,
} from "./db";
import { CommandRequestBody, ErrorReportBody, Device } from "./types";

const app = express();
const port = 3000;
const SERVER_START_MSG: string =
  "Express server started on port: " + port.toString();

// Global variable for fan/vent state (for example purposes)
let ventState: 0 | 1 = 0; // Use 0 | 1 type for strictness

// Middleware for parsing JSON request bodies
app.use(express.json());

// --- Endpoints for ESP32 (or other IoT devices) ---

// Endpoint for ESP32 to retrieve vent state
app.get("/api/esp32-vent/data", (req: Request, res: Response) => {
  logger.info(`ESP32 requested vent state data. Current state: ${ventState}`);
  // TODO: Add logic here to update the last_communication_at
  // for the specific ESP32 device that made the request.
  // if (req.query.device_id) {
  //   await updateLastCommunication(req.query.device_id as string);
  // }
  res.json({ value: ventState });
});

// Endpoint for sending commands to the vent (hub -> device)
app.post(
  "/api/esp32-vent/command",
  (req: Request<{}, {}, CommandRequestBody>, res: Response) => {
    const { value } = req.body;

    // Input validation
    if (typeof value === "number" && (value === 0 || value === 1)) {
      ventState = value;
      logger.info(`Command received: Set ventState to ${ventState}`);
      res.status(200).json({
        message: "State updated successfully",
        newValue: ventState,
      });
    } else {
      logger.warn(
        `Invalid command received. Expected value 0 or 1, got: ${value}`
      );
      res.status(400).json({
        error: "Invalid input. 'value' must be 0 or 1.",
        receivedValue: value,
      });
    }
  }
);

// --- Endpoints for IoT devices (general communication) ---

// Endpoint for registering a new device or updating its basic information
app.post("/api/devices/register", async (req: Request, res: Response) => {
  const { device_type, device_name, mac_address, firmware_version, location } =
    req.body;

  if (!device_type || !device_name) {
    return res
      .status(400)
      .json({ error: "device_type and device_name are required." });
  }

  try {
    const newDevice = await addDevice(
      device_type,
      device_name,
      mac_address,
      firmware_version,
      location
    );

    if (newDevice) {
      res.status(201).json({
        message: "Device registered/updated successfully",
        device: newDevice,
      });
    } else {
      res.status(500).json({ error: "Failed to register/update device." });
    }
  } catch (error: any) {
    logger.err(`Error registering device: ${error.message}`);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Endpoint for reporting device communication (heartbeat, sensor data)
// IoT devices should send this request periodically
app.post(
  "/api/devices/:deviceUniqueId/heartbeat",
  async (req: Request<{ deviceUniqueId: string }>, res: Response) => {
    const { deviceUniqueId } = req.params;

    try {
      const success = await updateLastCommunication(deviceUniqueId);

      if (success) {
        res
          .status(200)
          .json({ message: `Heartbeat received for ${deviceUniqueId}.` });
      } else {
        res
          .status(404)
          .json({ error: `Device with ID ${deviceUniqueId} not found.` });
      }
    } catch (error: any) {
      logger.err(`Error updating heartbeat: ${error.message}`);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Endpoint for devices to report errors
app.post(
  "/api/devices/:deviceUniqueId/error",
  async (
    req: Request<{ deviceUniqueId: string }, {}, ErrorReportBody>,
    res: Response
  ) => {
    const { deviceUniqueId } = req.params;
    const { error_message, error_code } = req.body;

    if (!error_message) {
      return res.status(400).json({ error: "error_message is required." });
    }

    try {
      const errorReport = await addDeviceError(
        deviceUniqueId,
        error_message,
        error_code
      );

      if (errorReport) {
        res
          .status(201)
          .json({ message: "Error reported successfully", error: errorReport });
      } else {
        res.status(500).json({ error: "Failed to report error." });
      }
    } catch (error: any) {
      logger.err(`Error adding device error: ${error.message}`);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// --- Endpoints for User Interface (Mobile/Web) ---

// Get all registered devices
app.get("/api/devices", async (req: Request, res: Response) => {
  try {
    const devices = await getAllDevices();
    res.status(200).json(devices);
  } catch (error: any) {
    logger.err(`Error getting all devices: ${error.message}`);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get details of a specific device by its unique ID
app.get(
  "/api/devices/:deviceUniqueId",
  async (req: Request<{ deviceUniqueId: string }>, res: Response) => {
    const { deviceUniqueId } = req.params;

    try {
      const device = await getDeviceByUniqueId(deviceUniqueId);

      if (device) {
        res.status(200).json(device);
      } else {
        res
          .status(404)
          .json({ error: `Device with ID ${deviceUniqueId} not found.` });
      }
    } catch (error: any) {
      logger.err(`Error getting device by ID: ${error.message}`);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Get errors for a specific device
app.get(
  "/api/devices/:deviceUniqueId/errors",
  async (req: Request<{ deviceUniqueId: string }>, res: Response) => {
    const { deviceUniqueId } = req.params;
    // Use query param ?unresolved=true to filter for unresolved errors
    const onlyUnresolved = req.query.unresolved === "true";

    try {
      const errors = await getDeviceErrors(deviceUniqueId, onlyUnresolved);
      res.status(200).json(errors);
    } catch (error: any) {
      logger.err(`Error getting device errors: ${error.message}`);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Endpoint to manually set a device's status to offline (e.g., for an administrator)
app.post(
  "/api/devices/:deviceUniqueId/set-offline",
  async (req: Request<{ deviceUniqueId: string }>, res: Response) => {
    const { deviceUniqueId } = req.params;

    try {
      const success = await setDeviceOffline(deviceUniqueId);

      if (success) {
        res
          .status(200)
          .json({ message: `Device ${deviceUniqueId} set to offline.` });
      } else {
        res
          .status(404)
          .json({ error: `Device with ID ${deviceUniqueId} not found.` });
      }
    } catch (error: any) {
      logger.err(`Error setting device offline: ${error.message}`);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// --- Basic Home Endpoint ---
app.get("/", (req: Request, res: Response) => {
  res.send("Hello IoT World, from Express!");
});

// --- Server Start ---
// Initialize the database connection and start the server
async function startServer() {
  try {
    // Connect to database first
    await connectDb();
    logger.info("Database connected successfully");

    // Start the server
    app.listen(port, (err?: Error) => {
      if (!!err) {
        logger.err(err.message);
      } else {
        logger.info(SERVER_START_MSG);
        // Run initial DB checks after server starts
        runInitialDbChecks();
      }
    });
  } catch (error: any) {
    logger.err(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Function to run after server starts, e.g., to perform initial device state checks
async function runInitialDbChecks() {
  try {
    logger.info("\n--- Running initial DB checks ---");

    // Simulate adding devices (for testing purposes)
    await addDevice(
      "ESP32",
      "TemperatureSensor01",
      "AA:BB:CC:DD:EE:F1",
      "1.0.0",
      "Living Room"
    );
    await addDevice(
      "Raspberry Pi",
      "SecurityCam01",
      "AA:BB:CC:DD:EE:F2",
      "2.0.1",
      "Front Door"
    );
    await addDevice(
      "ESP32",
      "LightSwitch01",
      "AA:BB:CC:DD:EE:F3",
      "1.0.5",
      "Kitchen"
    );

    // Attempt to add a duplicate (will trigger a warning)
    await addDevice(
      "ESP32",
      "TemperatureSensor01",
      "AA:BB:CC:DD:EE:F1",
      "1.0.0",
      "Living Room"
    );

    // Get the actual device unique IDs that were generated
    const devices = await getAllDevices();
    logger.info("\n--- Current Devices ---");
    logger.info(JSON.stringify(devices, null, 2));

    if (devices.length > 0) {
      // Use actual device unique IDs for communication updates and errors
      const tempSensorDevice = devices.find(
        (d) => d.device_name === "TemperatureSensor01"
      );
      const securityCamDevice = devices.find(
        (d) => d.device_name === "SecurityCam01"
      );
      const lightSwitchDevice = devices.find(
        (d) => d.device_name === "LightSwitch01"
      );

      if (tempSensorDevice) {
        // Simulate communication updates
        await updateLastCommunication(tempSensorDevice.device_unique_id);

        // Simulate error reporting
        await addDeviceError(
          tempSensorDevice.device_unique_id,
          "Sensor reading out of range",
          "ERR-S001"
        );

        logger.info("\n--- Errors for TemperatureSensor01 ---");
        const tempSensorErrors = await getDeviceErrors(
          tempSensorDevice.device_unique_id
        );
        logger.info(JSON.stringify(tempSensorErrors, null, 2));
      }

      if (securityCamDevice) {
        await updateLastCommunication(securityCamDevice.device_unique_id);
      }

      if (lightSwitchDevice) {
        await addDeviceError(
          lightSwitchDevice.device_unique_id,
          "WiFi connection lost",
          "ERR-W001"
        );
      }
    }

    // Automatically mark devices as offline based on communication inactivity
    // In a real application, this should be a scheduled task (e.g., cron job, separate worker)
    setInterval(async () => {
      try {
        const offlineThresholdMs = 5 * 60 * 1000; // 5 minutes
        const now = new Date();
        const allCurrentDevices = await getAllDevices();

        const potentiallyOfflineDevices = allCurrentDevices.filter((device) => {
          const lastComm = new Date(device.last_communication_at);
          return (
            now.getTime() - lastComm.getTime() > offlineThresholdMs &&
            device.is_online === 1
          );
        });

        if (potentiallyOfflineDevices.length > 0) {
          logger.warn(
            `Found ${
              potentiallyOfflineDevices.length
            } potentially offline devices (past ${
              offlineThresholdMs / 1000 / 60
            } min threshold):`
          );
          for (const device of potentiallyOfflineDevices) {
            logger.warn(
              `- Setting ${device.device_name} (Unique ID: ${device.device_unique_id}) to offline.`
            );
            await setDeviceOffline(device.device_unique_id);
          }
        }
      } catch (error: any) {
        logger.err(`Error in offline device check: ${error.message}`);
      }
    }, 60 * 1000); // Check every minute
  } catch (error: any) {
    logger.err(`Error in initial DB checks: ${error.message}`);
  }
}

// Start the server
startServer();
