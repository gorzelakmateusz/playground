import network
import time
import urequests
import ujson
from machine import Pin

# Pin definitions
STATUS_LED_GPIO = 2
KY019_RELAY_GPIO = 4  # GPIO pin for KY-019 relay module
LED_ON = 1
LED_OFF = 0
RELAY_ON = 1
RELAY_OFF = 0

# WiFi credentials
WIFI_SSID = "x"
WIFI_PASS = "x"
WIFI_MAXIMUM_RETRY = 5 # Not directly used in the same way as Arduino, but kept for reference

# Timing constants
RECONNECT_INTERVAL_MS = 30000
WIFI_CHECK_INTERVAL_MS = 5000
MONITOR_INTERVAL_MS = 60000
REST_CHECK_INTERVAL_MS = 5000
LED_UPDATE_INTERVAL_MS = 100

# Signal thresholds
POOR_SIGNAL_THRESHOLD = -85
WEAK_SIGNAL_THRESHOLD = -80
POOR_SIGNAL_COUNT_LIMIT = 10

# API URLs
DATA_FETCH_URL = "http://192.168.31.69:3000/api/esp32-vent/data"

# LED status enumeration (using a dictionary for MicroPython)
LED_STATUS = {
    "OFF": 0,
    "CONNECTING": 1,
    "CONNECTED": 2,
    "ERROR": 3,
    "READY": 4
}

# Global variables
wifi_retry_count = 0
wifi_connected = False
last_reconnect_attempt = 0
current_led_status = LED_STATUS["OFF"]
poor_signal_count = 0

# Relay control variables
last_relay_state = -1  # -1 = uninitialized, 0 = OFF, 1 = ON
relay_initialized = False

# Task timing variables
last_wifi_check = 0
last_monitor_report = 0
last_vent_check = 0
last_led_update = 0

# LED blinking variables
led_state = False
led_blink_count = 0 # Not directly used in the same way, logic handled by time

# Hardware objects
status_led = Pin(STATUS_LED_GPIO, Pin.OUT)
ky019_relay = Pin(KY019_RELAY_GPIO, Pin.OUT)
sta_if = network.WLAN(network.STA_IF)

def initialize_relay():
    """Initializes the KY-019 relay pin."""
    ky019_relay.value(RELAY_OFF)  # Start with relay OFF
    global relay_initialized, last_relay_state
    relay_initialized = True
    last_relay_state = 0
    print(f"KY-019 relay initialized on GPIO {KY019_RELAY_GPIO} (OFF)")

def set_relay_state(state):
    """Sets the state of the KY-019 relay."""
    global last_relay_state
    if not relay_initialized:
        print("Error: Relay not initialized")
        return

    if state != last_relay_state:
        if state == 1:
            ky019_relay.value(RELAY_ON)
            print("KY-019 Relay: ON")
        elif state == 0:
            ky019_relay.value(RELAY_OFF)
            print("KY-019 Relay: OFF")
        else:
            print(f"Invalid relay state: {state} (should be 0 or 1)")
            return
        last_relay_state = state

def connect_to_wifi():
    """Attempts to connect to the WiFi network."""
    global last_reconnect_attempt, current_led_status, wifi_connected, wifi_retry_count
    
    last_reconnect_attempt = time.ticks_ms()
    current_led_status = LED_STATUS["CONNECTING"]

    print(f"Attempting WiFi connection to: {WIFI_SSID}")

    sta_if.active(True)
    sta_if.connect(WIFI_SSID, WIFI_PASS)
    wifi_retry_count = 0

    # Wait for connection with timeout
    timeout_s = 20
    start_time = time.ticks_ms()
    while not sta_if.isconnected() and time.ticks_diff(time.ticks_ms(), start_time) < timeout_s * 1000:
        time.sleep_ms(1000)
        print(".", end="")
    print()

    if sta_if.isconnected():
        print("WiFi connection successful")
        wifi_connected = True
        wifi_retry_count = 0
        current_led_status = LED_STATUS["CONNECTED"]
    else:
        print("WiFi connection failed")
        wifi_connected = False
        current_led_status = LED_STATUS["ERROR"]
        print_available_networks()

def update_led(current_time):
    """Updates the status LED based on the current system state."""
    global last_led_update, led_state

    if time.ticks_diff(current_time, last_led_update) < LED_UPDATE_INTERVAL_MS:
        return

    last_led_update = current_time

    if current_led_status == LED_STATUS["OFF"]:
        status_led.value(LED_OFF)
    elif current_led_status == LED_STATUS["CONNECTING"]:
        led_state = not led_state
        status_led.value(LED_ON if led_state else LED_OFF)
    elif current_led_status == LED_STATUS["CONNECTED"]:
        # Single blink every 2 seconds
        if (current_time // 100) % 20 == 0:
            status_led.value(LED_ON)
        elif (current_time // 100) % 20 == 1:
            status_led.value(LED_OFF)
    elif current_led_status == LED_STATUS["ERROR"]:
        # Triple blink pattern
        pattern = (current_time // 100) % 40
        if pattern < 6:
            status_led.value(LED_ON if (pattern % 2) else LED_OFF)
        else:
            status_led.value(LED_OFF)
    elif current_led_status == LED_STATUS["READY"]:
        if (current_time // 100) % 50 == 0:
            status_led.value(LED_ON)
        elif (current_time // 100) % 50 < 3:
            status_led.value(LED_ON)
        else:
            status_led.value(LED_OFF)

def wifi_monitor_task():
    """Monitors WiFi signal strength and handles reconnections."""
    global poor_signal_count, wifi_connected, current_led_status

    if wifi_connected and sta_if.isconnected():
        rssi = sta_if.status('rssi')

        if rssi < POOR_SIGNAL_THRESHOLD:
            poor_signal_count += 1
            print(f"Very poor signal: {rssi} dBm (count: {poor_signal_count})")

            if poor_signal_count >= POOR_SIGNAL_COUNT_LIMIT:
                print("Signal consistently poor, forcing reconnect")
                force_wifi_reconnect()
                poor_signal_count = 0
        elif rssi < WEAK_SIGNAL_THRESHOLD:
            poor_signal_count = 0
            print(f"Weak signal: {rssi} dBm")
        else:
            poor_signal_count = 0
            if current_led_status != LED_STATUS["READY"]:
                current_led_status = LED_STATUS["CONNECTED"]
    elif not wifi_connected:
        current_time = time.ticks_ms()
        if time.ticks_diff(current_time, last_reconnect_attempt) > RECONNECT_INTERVAL_MS:
            connect_to_wifi()
        poor_signal_count = 0

def system_monitor_task():
    """Prints a system status report to the serial console."""
    if wifi_connected and sta_if.isconnected():
        print("=== System Status Report ===")
        ip_info = sta_if.ifconfig()
        print(f"IP: {ip_info[0]} | Gateway: {ip_info[2]}")

        rssi = sta_if.status('rssi')
        quality = "Excellent" if rssi > -50 else \
                  "Good" if rssi > -60 else \
                  "Fair" if rssi > -70 else \
                  "Weak" if rssi > -80 else \
                  "Very Weak"

        print(f"RSSI: {rssi} dBm ({quality}) | SSID: {WIFI_SSID}")

        print(f"Uptime: {time.ticks_ms() // 1000} sec | Free Heap: {gc.mem_free()} bytes") # gc.mem_free() for free heap

        relay_state_str = "ON" if last_relay_state == 1 else \
                          "OFF" if last_relay_state == 0 else \
                          "UNINITIALIZED"
        print(f"Relay State: {relay_state_str}")
        print("============================")
    else:
        print("WiFi disconnected - system monitoring limited")

def check_vent_state_task():
    """Fetches vent state from the API and controls the relay."""
    global current_led_status

    if not wifi_connected or not sta_if.isconnected():
        print("WiFi not connected, skipping HTTP request. Relay state unchanged.")
        return

    print(f"Fetching data from: {DATA_FETCH_URL}")

    try:
        response = urequests.get(DATA_FETCH_URL, timeout=10) # Timeout in seconds for urequests
        
        if response.status_code == 200:
            raw_response = response.text
            print(f"RAW Response (Status {response.status_code}): '{raw_response}'")

            if len(raw_response) > 0:
                try:
                    data = ujson.loads(raw_response)
                    if "value" in data and isinstance(data["value"], (int, float)): # ujson might parse as float
                        retrieved_value = int(data["value"]) # Convert to int
                        if retrieved_value == 0 or retrieved_value == 1:
                            print(f"Vent state: {retrieved_value}")
                            set_relay_state(retrieved_value)
                            current_led_status = LED_STATUS["READY"]
                        else:
                            print(f"Value ({retrieved_value}) not 0 or 1. Check server data. Relay state unchanged.")
                            current_led_status = LED_STATUS["ERROR"]
                    else:
                        print("JSON parsing error: 'value' not number or not found. Relay state unchanged.")
                        current_led_status = LED_STATUS["ERROR"]
                except ValueError as e:
                    print(f"JSON parse failed: {e}. Relay state unchanged.")
                    current_led_status = LED_STATUS["ERROR"]
            else:
                print("HTTP response has 200 OK, but Content-Length is 0 or less. Nothing to parse. Relay state unchanged.")
                current_led_status = LED_STATUS["READY"]
        else:
            print(f"HTTP GET failed. Status: {response.status_code}. Server offline - relay state unchanged.")
            current_led_status = LED_STATUS["ERROR"]
        
        response.close() # Close the response to free up resources

    except Exception as e:
        print(f"HTTP GET request error: {e}. Server offline - relay state unchanged.")
        current_led_status = LED_STATUS["ERROR"]

def print_available_networks():
    """Scans and prints available WiFi networks."""
    print("Scanning for available networks...")
    sta_if.active(True) # Ensure STA mode is active for scanning
    networks = sta_if.scan()

    if not networks:
        print("No networks found")
    else:
        print(f"Available networks ({len(networks)} found):")
        for ssid, bssid, channel, rssi, authmode, hidden in networks:
            auth_str = "Open"
            if authmode == network.AUTH_WEP: auth_str = "WEP"
            elif authmode == network.AUTH_WPA_PSK: auth_str = "WPA-PSK"
            elif authmode == network.AUTH_WPA2_PSK: auth_str = "WPA2-PSK"
            elif authmode == network.AUTH_WPA_WPA2_PSK: auth_str = "WPA/WPA2-PSK"
            elif authmode == network.AUTH_WPA2_ENTERPRISE: auth_str = "WPA2-EAP" # More specific, but typically shown as Encrypted
            
            print(f"  {ssid.decode()} ({rssi} dBm) [{auth_str}]") # Decode SSID from bytes

def force_wifi_reconnect():
    """Forces a WiFi disconnection and reconnection attempt."""
    global current_led_status, last_reconnect_attempt, wifi_retry_count
    print("Forcing WiFi reconnection...")
    current_led_status = LED_STATUS["CONNECTING"]
    sta_if.disconnect()
    time.sleep_ms(1000)
    last_reconnect_attempt = 0 # Reset last attempt to trigger immediate reconnect
    wifi_retry_count = 0
    connect_to_wifi()

# Main setup and loop
def main():
    global last_wifi_check, last_monitor_report, last_vent_check
    
    print("ESP32 MicroPython Vent Monitor Starting...")

    # Initialize LED pin
    status_led.value(LED_OFF)

    # Initialize KY-019 relay pin
    initialize_relay()

    # Initial WiFi connection
    current_led_status = LED_STATUS["CONNECTING"]
    connect_to_wifi()

    print("Setup completed successfully")

    while True:
        current_time = time.ticks_ms()

        # Update LED status
        update_led(current_time)

        # WiFi monitoring task
        if time.ticks_diff(current_time, last_wifi_check) >= WIFI_CHECK_INTERVAL_MS:
            wifi_monitor_task()
            last_wifi_check = current_time

        # System monitoring task
        if time.ticks_diff(current_time, last_monitor_report) >= MONITOR_INTERVAL_MS:
            system_monitor_task()
            last_monitor_report = current_time

        # Vent state checking task
        if time.ticks_diff(current_time, last_vent_check) >= REST_CHECK_INTERVAL_MS:
            check_vent_state_task()
            last_vent_check = current_time

        time.sleep_ms(50) # Small delay to prevent watchdog issues

if __name__ == '__main__':
    main()