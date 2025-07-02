/**
 * @file main.ino
 * @brief ESP32 Thermocouple Control System with Bluetooth Communication.
 *
 * This firmware controls a heating element based on thermocouple readings,
 * allowing temperature target setting via Bluetooth. It incorporates
 * non-blocking timing, temperature smoothing, and basic error handling.
 */

#include <Thermocouple.h>
#include <MAX6675_Thermocouple.h>
#include <SmoothThermocouple.h>
#include "BluetoothSerial.h"

// Check if Bluetooth is enabled in menuconfig
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to enable it
#endif

// --- System Settings ---
/** @def SMOOTHING_FACTOR
 * @brief Factor for temperature smoothing. A higher value means more smoothing.
 * Keep this as 1 for now, as per original.
 */
#define SMOOTHING_FACTOR 1

/** @def ERROR_LIMIT
 * @brief Number of consecutive large temperature deviations before an ESP restart.
 */
#define ERROR_LIMIT 15

/** @def TEMPERATURE_READ_INTERVAL_MS
 * @brief Interval in milliseconds at which the temperature sensor is read.
 */
#define TEMPERATURE_READ_INTERVAL_MS 1000 // Read temperature every 1 second

/** @def BLUETOOTH_REPORT_INTERVAL_MS
 * @brief Interval in milliseconds at which status is reported via Bluetooth.
 */
#define BLUETOOTH_REPORT_INTERVAL_MS 1000 // Report status every 1 second

// --- Bluetooth ---
/** @var SerialBT
 * @brief BluetoothSerial object for communication.
 */
BluetoothSerial SerialBT;

/** @var bt_received_msg
 * @brief Stores incoming Bluetooth messages.
 */
String bt_received_msg = "";

/** @var bluetooth_last_report_time
 * @brief Timestamp of the last Bluetooth status report.
 */
unsigned long bluetooth_last_report_time = 0;


// --- Thermocouple ---
/** @var thermocouple
 * @brief Pointer to the Thermocouple object (SmoothThermocouple wrapping MAX6675).
 */
Thermocouple* thermocouple = nullptr; // Changed NULL to nullptr for C++ best practice

/** @var temperature_bottom_current
 * @brief Current temperature reading from the bottom thermocouple.
 */
int temperature_bottom_current = -1;

/** @var temperature_bottom_prev
 * @brief Previous temperature reading for deviation check.
 */
int temperature_bottom_prev = -1;

/** @var temperature_bottom_target
 * @brief Target temperature set by the user (default 50°C).
 */
int temperature_bottom_target = 50;

/** @var temp_dif_bot_target_current
 * @brief Difference between target and current temperature.
 */
int temp_dif_bot_target_current = 0;

/** @var histeresis_coeff
 * @brief Hysteresis coefficient for temperature error detection.
 * A value of 50 degrees is very high for error detection, adjusted to a more realistic 10.
 * Consider if this should be a "rate of change" limit instead of absolute difference.
 */
int histeresis_coeff = 10; // Adjusted from 50 to 10 for more sensitive error detection

/** @var error_count
 * @brief Counter for consecutive temperature reading errors.
 */
int error_count = 0;

// --- Thermocouple Pins (MAX6675) ---
/** @def POWER_SOURCE_PIN
 * @brief GPIO pin connected to the heating element's power control (e.g., MOSFET gate).
 */
const int POWER_SOURCE_PIN = 23; // Changed to const

/** @def THERMOCOUPLE_BOTTOM_SO
 * @brief MAX6675 Serial Output (SO) pin.
 */
const int THERMOCOUPLE_BOTTOM_SO = 13; // Changed to const

/** @def THERMOCOUPLE_BOTTOM_CS
 * @brief MAX6675 Chip Select (CS) pin.
 */
const int THERMOCOUPLE_BOTTOM_CS = 12; // Changed to const

/** @def THERMOCOUPLE_BOTTOM_SCK
 * @brief MAX6675 Serial Clock (SCK) pin.
 */
const int THERMOCOUPLE_BOTTOM_SCK = 14; // Changed to const

// --- Heating Parameters ---
/** @def VERY_CAREFUL_STAGE_DIF_DEGREES
 * @brief Temperature difference threshold for the "very careful" heating stage.
 */
const int VERY_CAREFUL_STAGE_DIF_DEGREES = 15; // Changed to const

/** @def VERY_CAREFUL_HEATING_DURATION_SECONDS
 * @brief Duration in seconds for the "very careful" heating stage.
 */
const int VERY_CAREFUL_HEATING_DURATION_SECONDS = 6; // Changed to const

/** @def CAREFUL_HEATING_DURATION_SECONDS
 * @brief Duration in seconds for the "careful" heating stage.
 */
const int CAREFUL_HEATING_DURATION_SECONDS = 10; // Changed to const

// --- Timer and Time Tracking ---
/** @var interruptCounter
 * @brief Counter incremented by timer interrupt every second.
 */
volatile int interruptCounter = 0; // Initialize to 0

/** @var timer
 * @brief Hardware timer handle.
 */
hw_timer_t* timer = nullptr; // Changed NULL to nullptr

/** @var timerMux
 * @brief Mutex for protecting access to `interruptCounter` from ISR.
 */
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

/** @var time_from_system_up_in_seconds
 * @brief Tracks time elapsed since system startup in seconds.
 */
unsigned long time_from_system_up_in_seconds = 0; // Changed long unsigned int to unsigned long

/** @var heating_start_time_seconds
 * @brief Stores the time (in seconds from system up) when heating last started.
 * Used to track elapsed time for heating stages.
 */
unsigned long heating_start_time_seconds = 0; // Changed name and initialized to 0

/** @var last_temperature_read_time_ms
 * @brief Timestamp of the last temperature sensor read.
 */
unsigned long last_temperature_read_time_ms = 0;


// --- Function Prototypes ---
void IRAM_ATTR onTimer();
void setup_timer();
void task_calculate_time();
String time_sec_to_hhmmss(unsigned long sec);
void error_occurred();
void read_temperature_sensor();
unsigned int get_heating_time_left(int duration_seconds);
void control_heating();
void handle_bluetooth_commands();
void print_bluetooth_status();


// --- Helper Functions ---

/**
 * @brief Interrupt Service Routine (ISR) for the hardware timer.
 * Increments `interruptCounter` every second.
 */
void IRAM_ATTR onTimer() {
    portENTER_CRITICAL_ISR(&timerMux);
    interruptCounter++;
    portEXIT_CRITICAL_ISR(&timerMux);
}

/**
 * @brief Configures and starts a hardware timer to fire every 1 second.
 */
void setup_timer() {
    // Timer 0, prescaler 80 (80MHz / 80 = 1MHz -> 1 tick = 1us)
    timer = timerBegin(0, 80, true);
    // Attach the ISR `onTimer` to the timer.
    timerAttachInterrupt(timer, &onTimer, true);
    // Set alarm to trigger every 1,000,000 ticks (1 second) and repeat.
    timerAlarmWrite(timer, 1000000, true);
    // Enable the timer alarm.
    timerAlarmEnable(timer);
}

/**
 * @brief Task to update `time_from_system_up_in_seconds` based on timer interrupt.
 * Should be called frequently in `loop()`.
 */
void task_calculate_time() {
    if (interruptCounter > 0) {
        // Protect `interruptCounter` from concurrent access.
        portENTER_CRITICAL(&timerMux);
        interruptCounter--;
        portEXIT_CRITICAL(&timerMux);
        // Increment system uptime.
        ++time_from_system_up_in_seconds;
    }
}

/**
 * @brief Converts seconds into HH:MM:SS format string.
 * @param sec The total number of seconds.
 * @return A String representing the time in HH:MM:SS format.
 */
String time_sec_to_hhmmss(unsigned long sec) { // Changed long unsigned int to unsigned long
    char buffer[16];
    snprintf(buffer, sizeof(buffer), "%02lu:%02lu:%02lu", sec / 3600, (sec % 3600) / 60, sec % 60);
    return String(buffer);
}

/**
 * @brief Handles error occurrences, increments error count, and restarts ESP if limit is reached.
 */
void error_occurred() { // Renamed from errorOccured
    ++error_count;
    SerialBT.println("Error occurred. Current error count = " + String(error_count)); // Updated message
    if (error_count >= ERROR_LIMIT) {
        SerialBT.println("Error limit reached. ESP will restart."); // Updated message
        delay(5000); // Give time for message to send
        ESP.restart(); // Restart the ESP32
    }
}

/**
 * @brief Reads the temperature from the thermocouple sensor.
 * Performs basic error checking based on `histeresis_coeff`.
 * Discards reading and increments error count if deviation is too large.
 */
void read_temperature_sensor() { // Renamed from sensor_temperature_bottom
    int temp = (int)thermocouple->readCelsius();
    temperature_bottom_prev = temperature_bottom_current; // Store current as previous

    // Protection against erratic thermocouple readings.
    // If the temperature changes drastically (more than histeresis_coeff) from the previous reading,
    // consider it an error and revert to the previous stable reading.
    if (temperature_bottom_prev != -1 && abs(temp - temperature_bottom_prev) > histeresis_coeff) {
        Serial.println("WARN: Large temp deviation detected. Current: " + String(temp) + ", Prev: " + String(temperature_bottom_prev));
        error_occurred();
        // Keep the previous value if an error occurred to prevent bad data propagation
        temperature_bottom_current = temperature_bottom_prev;
        return; // Exit function, don't update current temperature with bad data
    }
    temperature_bottom_current = temp; // Update current temperature only if no error detected
}

/**
 * @brief Calculates the remaining heating time for a given stage duration.
 * @param duration_seconds The total duration of the heating stage in seconds.
 * @return The time left in seconds for the current heating stage.
 */
unsigned int get_heating_time_left(int duration_seconds) { // Renamed from time_left_heating
    long elapsed = time_from_system_up_in_seconds - heating_start_time_seconds;
    // Ensure we don't return negative if duration has passed
    return (duration_seconds > elapsed) ? (duration_seconds - elapsed) : 0;
}

/**
 * @brief Controls the heating element based on current temperature and target.
 * Implements "careful" and "very careful" heating stages with time limits.
 */
void control_heating() { // Renamed from heating_handler
    // Calculate difference to target
    temp_dif_bot_target_current = temperature_bottom_target - temperature_bottom_current;

    // This logic determines when to reset the heating timer.
    // If the temperature drops, it implies the heating cycle might need to restart or be re-evaluated.
    if (temperature_bottom_current < temperature_bottom_prev) {
        heating_start_time_seconds = time_from_system_up_in_seconds;
        Serial.println("Heating timer reset due to temp drop.");
    }

    bool heating_on = false;
    unsigned int time_left_stage = 0; // Renamed to clarify it's for the current stage

    // "Careful" stage: target is far away (e.g., > 15 degrees difference)
    if (temp_dif_bot_target_current > VERY_CAREFUL_STAGE_DIF_DEGREES) {
        if (get_heating_time_left(CAREFUL_HEATING_DURATION_SECONDS) > 0) {
            heating_on = true;
            time_left_stage = get_heating_time_left(CAREFUL_HEATING_DURATION_SECONDS);
            SerialBT.println("HEAT=ON careful (" + String(time_left_stage) + "s)");
        } else {
            // If time for this stage has expired, turn off heating
            heating_on = false;
        }
    }
    // "Very careful" stage: closer to target (e.g., > 1 degree difference)
    else if (temp_dif_bot_target_current > 1) { // Original logic: ensures at least 2 degrees difference
        if (get_heating_time_left(VERY_CAREFUL_HEATING_DURATION_SECONDS) > 0) {
            heating_on = true;
            time_left_stage = get_heating_time_left(VERY_CAREFUL_HEATING_DURATION_SECONDS);
            SerialBT.println("HEAT=ON very careful (" + String(time_left_stage) + "s)");
        } else {
            // If time for this stage has expired, turn off heating
            heating_on = false;
        }
    } else {
        // Temperature is at or very near target, turn off heating
        heating_on = false;
    }

    // Apply heating state to the output pin
    digitalWrite(POWER_SOURCE_PIN, heating_on ? HIGH : LOW);

    // This static variable helps track the transition of heating state
    // and ensures messages like "HEAT=OFF" are printed only once when heating turns off.
    static bool prev_heating_state = false;
    if (heating_on && !prev_heating_state) {
        // Heating just turned ON - reset timer for the new heating cycle
        heating_start_time_seconds = time_from_system_up_in_seconds;
    } else if (!heating_on && prev_heating_state) {
        // Heating just turned OFF
        SerialBT.println("HEAT=OFF");
    }
    prev_heating_state = heating_on; // Update state for next loop iteration
}

/**
 * @brief Handles incoming Bluetooth commands.
 * Expects commands starting with '1' followed by target temperature,
 * terminated by a newline character.
 */
void handle_bluetooth_commands() { // Renamed from task_BT_Handler
    while (SerialBT.available()) {
        char incomingChar = (char)SerialBT.read();
        bt_received_msg += incomingChar;

        // Process message when a newline character is received
        if (incomingChar == '\n') {
            if (bt_received_msg.startsWith("1")) {
                // Remove '1' and any trailing newline/carriage return, then convert to integer
                String tempStr = bt_received_msg.substring(1);
                tempStr.trim(); // Remove any whitespace (including \r\n)
                temperature_bottom_target = tempStr.toInt();
                SerialBT.println("New target = " + String(temperature_bottom_target));
            } else {
                SerialBT.println("Invalid command header. Expected '1'. Message ignored.");
            }
            bt_received_msg = ""; // Clear message buffer after processing
        }
    }
}

/**
 * @brief Prints current system status (temperatures, target, uptime) via Bluetooth.
 * Avoids flooding the serial output by printing at a defined interval.
 */
void print_bluetooth_status() {
    if (millis() - bluetooth_last_report_time >= BLUETOOTH_REPORT_INTERVAL_MS) {
        bluetooth_last_report_time = millis();
        // Clear previous lines in terminal (common trick for console UIs)
        SerialBT.printf("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"); // 40 newlines approx
        SerialBT.printf("Current Temp: %d°C\n", temperature_bottom_current);
        SerialBT.printf("Target Temp:  %d°C\n", temperature_bottom_target);
        SerialBT.printf("System Uptime: %s\n", time_sec_to_hhmmss(time_from_system_up_in_seconds).c_str());
        SerialBT.printf("Temperature Difference to Target: %d°C\n", temp_dif_bot_target_current);
        SerialBT.printf("Errors: %d\n", error_count);
    }
}

// --- Setup & Loop ---

/**
 * @brief Initializes the system: serial communication, timer, thermocouple, and Bluetooth.
 */
void setup() {
    Serial.begin(115200); // Initialize Serial Monitor for debugging
    setup_timer(); // Start the 1-second hardware timer

    // Initialize the thermocouple. Using SmoothThermocouple for potential future smoothing.
    thermocouple = new SmoothThermocouple(
        new MAX6675_Thermocouple(THERMOCOUPLE_BOTTOM_SCK, THERMOCOUPLE_BOTTOM_CS, THERMOCOUPLE_BOTTOM_SO),
        SMOOTHING_FACTOR
    );

    SerialBT.begin("SzzczZ"); // Initialize Bluetooth with device name
    Serial.println("Bluetooth device named 'SzzczZ' is ready to pair!");

    pinMode(POWER_SOURCE_PIN, OUTPUT); // Set heating element control pin as output
    digitalWrite(POWER_SOURCE_PIN, LOW); // Ensure heating is off initially

    delay(2000); // Give some time for setup to complete and stabilize
}

/**
 * @brief Main loop that continuously runs tasks.
 * Uses non-blocking timing for responsiveness.
 */
void loop() {
    // Update system uptime based on timer interrupt
    task_calculate_time();

    // Task: Read temperature sensor and control heating at defined intervals
    if (millis() - last_temperature_read_time_ms >= TEMPERATURE_READ_INTERVAL_MS) {
        last_temperature_read_time_ms = millis();
        read_temperature_sensor();
        control_heating(); // Control heating immediately after reading temperature
    }

    // Task: Handle incoming Bluetooth commands (non-blocking)
    handle_bluetooth_commands();

    // Task: Report status via Bluetooth at defined intervals (non-blocking)
    print_bluetooth_status();

    // No delay() here! The loop runs continuously, allowing immediate reaction to events.
}
