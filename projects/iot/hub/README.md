# IoT Device Hub Backend

This is a Node.js Express application designed to act as a central hub for managing IoT devices using SQLite as its database. It provides API endpoints for device registration, communication tracking (heartbeats), error reporting, and querying device status and history.

---

## Features

* **Device Management:** Register and track various types of IoT devices (e.g., ESP32, Raspberry Pi).
* **Unique Device Identification:** Devices are identified by a unique ID (e.g., MAC address-based).
* **Communication Tracking:** Records the last communication timestamp for each device, helping to determine online/offline status.
* **Error Reporting:** Devices can report errors, which are logged with timestamps, messages, and optional error codes.
* **Online/Offline Status:** Automatically marks devices as offline if no communication is received within a defined threshold.
* **SQLite Database:** Uses `better-sqlite3` for efficient and reliable local data storage.
* **Express.js API:** Provides RESTful API endpoints for interaction with devices and a frontend.
* **TypeScript:** Built with TypeScript for enhanced code quality and maintainability.

---