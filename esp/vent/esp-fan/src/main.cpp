#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Pin definitions
#define STATUS_LED_GPIO 2
#define KY019_RELAY_GPIO 4 // GPIO pin for KY-019 relay module
#define LED_ON HIGH
#define LED_OFF LOW
#define RELAY_ON HIGH
#define RELAY_OFF LOW

// WiFi credentials
#define WIFI_SSID "x"
#define WIFI_PASS "x"
#define WIFI_MAXIMUM_RETRY 5

// Timing constants
#define RECONNECT_INTERVAL_MS 30000
#define WIFI_CHECK_INTERVAL_MS 5000
#define MONITOR_INTERVAL_MS 60000
#define REST_CHECK_INTERVAL_MS 5000
#define LED_UPDATE_INTERVAL_MS 100

// Signal thresholds
#define POOR_SIGNAL_THRESHOLD -85
#define WEAK_SIGNAL_THRESHOLD -80
#define POOR_SIGNAL_COUNT_LIMIT 10

// API URLs
#define DATA_FETCH_URL "http://192.168.31.69:3000/api/esp32-vent/data"

// LED status enumeration
typedef enum
{
  LED_OFF_STATUS,
  LED_CONNECTING,
  LED_CONNECTED,
  LED_ERROR,
  LED_READY
} led_status_t;

// Global variables
static int wifi_retry_count = 0;
static bool wifi_connected = false;
static unsigned long last_reconnect_attempt = 0;
static volatile led_status_t current_led_status = LED_OFF_STATUS;
static int poor_signal_count = 0;

// Relay control variables
static int last_relay_state = -1; // -1 = uninitialized, 0 = OFF, 1 = ON
static bool relay_initialized = false;

// Task timing variables
static unsigned long last_wifi_check = 0;
static unsigned long last_monitor_report = 0;
static unsigned long last_vent_check = 0;
static unsigned long last_led_update = 0;

// LED blinking variables
static bool led_state = false;
static int led_blink_count = 0;

// Function declarations
void WiFiEvent(WiFiEvent_t event);
void connectToWiFi();
void updateLED(unsigned long current_time);
void wifiMonitorTask();
void systemMonitorTask();
void checkVentStateTask();
void printAvailableNetworks();
void forceWiFiReconnect();
void setRelayState(int state);
void initializeRelay();

void setup()
{
  Serial.begin(115200);
  Serial.println("ESP32 Arduino Vent Monitor Starting...");

  // Initialize LED pin
  pinMode(STATUS_LED_GPIO, OUTPUT);
  digitalWrite(STATUS_LED_GPIO, LED_OFF);

  // Initialize KY-019 relay pin
  initializeRelay();

  // Initialize WiFi
  WiFi.mode(WIFI_STA);
  WiFi.onEvent(WiFiEvent);

  current_led_status = LED_CONNECTING;
  connectToWiFi();

  Serial.println("Setup completed successfully");
}

void loop()
{
  unsigned long current_time = millis();

  // Update LED status
  updateLED(current_time);

  // WiFi monitoring task
  if (current_time - last_wifi_check >= WIFI_CHECK_INTERVAL_MS)
  {
    wifiMonitorTask();
    last_wifi_check = current_time;
  }

  // System monitoring task
  if (current_time - last_monitor_report >= MONITOR_INTERVAL_MS)
  {
    systemMonitorTask();
    last_monitor_report = current_time;
  }

  // Vent state checking task
  if (current_time - last_vent_check >= REST_CHECK_INTERVAL_MS)
  {
    checkVentStateTask();
    last_vent_check = current_time;
  }

  delay(50); // Small delay to prevent watchdog issues
}

void initializeRelay()
{
  pinMode(KY019_RELAY_GPIO, OUTPUT);
  digitalWrite(KY019_RELAY_GPIO, RELAY_OFF); // Start with relay OFF
  relay_initialized = true;
  last_relay_state = 0;
  Serial.printf("KY-019 relay initialized on GPIO %d (OFF)\n", KY019_RELAY_GPIO);
}

void setRelayState(int state)
{
  if (!relay_initialized)
  {
    Serial.println("Error: Relay not initialized");
    return;
  }

  if (state != last_relay_state)
  {
    if (state == 1)
    {
      digitalWrite(KY019_RELAY_GPIO, RELAY_ON);
      Serial.println("KY-019 Relay: ON");
    }
    else if (state == 0)
    {
      digitalWrite(KY019_RELAY_GPIO, RELAY_OFF);
      Serial.println("KY-019 Relay: OFF");
    }
    else
    {
      Serial.printf("Invalid relay state: %d (should be 0 or 1)\n", state);
      return;
    }

    last_relay_state = state;
  }
}

void WiFiEvent(WiFiEvent_t event)
{
  switch (event)
  {
  case ARDUINO_EVENT_WIFI_STA_START:
    Serial.println("WiFi started, attempting connection...");
    break;

  case ARDUINO_EVENT_WIFI_STA_CONNECTED:
    Serial.printf("Connected to WiFi network: %s\n", WiFi.SSID().c_str());
    break;

  case ARDUINO_EVENT_WIFI_STA_GOT_IP:
    Serial.printf("WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    wifi_retry_count = 0;
    wifi_connected = true;
    current_led_status = LED_CONNECTED;
    break;

  case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
    Serial.println("WiFi disconnected");
    wifi_connected = false;
    current_led_status = LED_CONNECTING;
    break;

  default:
    break;
  }
}

void connectToWiFi()
{
  last_reconnect_attempt = millis();
  current_led_status = LED_CONNECTING;

  Serial.printf("Attempting WiFi connection to: %s\n", WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  wifi_retry_count = 0;

  // Wait for connection with timeout
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20)
  {
    delay(1000);
    timeout++;
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("\nWiFi connection successful");
  }
  else
  {
    Serial.println("\nWiFi connection failed");
    current_led_status = LED_ERROR;
    printAvailableNetworks();
  }
}

void updateLED(unsigned long current_time)
{
  if (current_time - last_led_update < LED_UPDATE_INTERVAL_MS)
  {
    return;
  }

  last_led_update = current_time;

  switch (current_led_status)
  {
  case LED_OFF_STATUS:
    digitalWrite(STATUS_LED_GPIO, LED_OFF);
    break;

  case LED_CONNECTING:
    led_state = !led_state;
    digitalWrite(STATUS_LED_GPIO, led_state ? LED_ON : LED_OFF);
    break;

  case LED_CONNECTED:
    // Single blink every 2 seconds
    if ((current_time / 100) % 20 == 0)
    {
      digitalWrite(STATUS_LED_GPIO, LED_ON);
    }
    else if ((current_time / 100) % 20 == 1)
    {
      digitalWrite(STATUS_LED_GPIO, LED_OFF);
    }
    break;

  case LED_ERROR:
  {
    // Triple blink pattern
    int pattern = (current_time / 100) % 40;
    if (pattern < 6)
    {
      digitalWrite(STATUS_LED_GPIO, (pattern % 2) ? LED_ON : LED_OFF);
    }
    else
    {
      digitalWrite(STATUS_LED_GPIO, LED_OFF);
    }
  }
  break;

  case LED_READY:
    if ((current_time / 100) % 50 == 0)
    {
      digitalWrite(STATUS_LED_GPIO, LED_ON);
    }
    else if ((current_time / 100) % 50 < 3)
    {
      digitalWrite(STATUS_LED_GPIO, LED_ON);
    }
    else
    {
      digitalWrite(STATUS_LED_GPIO, LED_OFF);
    }
    break;
  }
}

void wifiMonitorTask()
{
  if (wifi_connected && WiFi.status() == WL_CONNECTED)
  {
    int32_t rssi = WiFi.RSSI();

    if (rssi < POOR_SIGNAL_THRESHOLD)
    {
      poor_signal_count++;
      Serial.printf("Very poor signal: %d dBm (count: %d)\n", rssi, poor_signal_count);

      if (poor_signal_count >= POOR_SIGNAL_COUNT_LIMIT)
      {
        Serial.println("Signal consistently poor, forcing reconnect");
        forceWiFiReconnect();
        poor_signal_count = 0;
      }
    }
    else if (rssi < WEAK_SIGNAL_THRESHOLD)
    {
      poor_signal_count = 0;
      Serial.printf("Weak signal: %d dBm\n", rssi);
    }
    else
    {
      poor_signal_count = 0;
      if (current_led_status != LED_READY)
      {
        current_led_status = LED_CONNECTED;
      }
    }
  }
  else if (!wifi_connected)
  {
    unsigned long current_time = millis();
    if (current_time - last_reconnect_attempt > RECONNECT_INTERVAL_MS)
    {
      connectToWiFi();
    }
    poor_signal_count = 0;
  }
}

void systemMonitorTask()
{
  if (wifi_connected && WiFi.status() == WL_CONNECTED)
  {
    Serial.println("=== System Status Report ===");
    Serial.printf("IP: %s | Gateway: %s\n",
                  WiFi.localIP().toString().c_str(),
                  WiFi.gatewayIP().toString().c_str());

    int32_t rssi = WiFi.RSSI();
    const char *quality = (rssi > -50) ? "Excellent" : (rssi > -60) ? "Good"
                                                   : (rssi > -70)   ? "Fair"
                                                   : (rssi > -80)   ? "Weak"
                                                                    : "Very Weak";

    Serial.printf("RSSI: %d dBm (%s) | SSID: %s\n",
                  rssi, quality, WiFi.SSID().c_str());

    Serial.printf("Uptime: %lu sec | Free Heap: %u bytes\n",
                  millis() / 1000, ESP.getFreeHeap());

    Serial.printf("Relay State: %s\n",
                  (last_relay_state == 1) ? "ON" : (last_relay_state == 0) ? "OFF"
                                                                           : "UNINITIALIZED");

    Serial.println("============================");
  }
  else
  {
    Serial.println("WiFi disconnected - system monitoring limited");
  }
}

void checkVentStateTask()
{
  if (!wifi_connected || WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi not connected, skipping HTTP request. Relay state unchanged.");
    return;
  }

  Serial.printf("Fetching data from: %s\n", DATA_FETCH_URL);

  HTTPClient http;
  http.begin(DATA_FETCH_URL);
  http.setTimeout(10000);

  int httpResponseCode = http.GET();

  if (httpResponseCode == 200)
  {
    String response = http.getString();
    Serial.printf("RAW Response (Status %d): '%s'\n", httpResponseCode, response.c_str());

    if (response.length() > 0)
    {
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, response);

      if (!error)
      {
        if (doc["value"].is<int>())
        {
          int retrieved_value = doc["value"];
          if (retrieved_value == 0 || retrieved_value == 1)
          {
            Serial.printf("Vent state: %d\n", retrieved_value);

            // Control KY-019 relay based on API response
            setRelayState(retrieved_value);

            current_led_status = LED_READY;
          }
          else
          {
            Serial.printf("Value (%d) not 0 or 1. Check server data. Relay state unchanged.\n", retrieved_value);
            current_led_status = LED_ERROR;
          }
        }
        else
        {
          Serial.println("JSON parsing error: 'value' not number or not found. Relay state unchanged.");
          current_led_status = LED_ERROR;
        }
      }
      else
      {
        Serial.printf("JSON parse failed: %s. Relay state unchanged.\n", error.c_str());
        current_led_status = LED_ERROR;
      }
    }
    else
    {
      Serial.println("HTTP response has 200 OK, but Content-Length is 0 or less. Nothing to parse. Relay state unchanged.");
      current_led_status = LED_READY;
    }
  }
  else if (httpResponseCode > 0)
  {
    Serial.printf("HTTP GET failed. Status: %d. Server offline - relay state unchanged.\n", httpResponseCode);
    current_led_status = LED_ERROR;
  }
  else
  {
    Serial.printf("HTTP GET request error: %s. Server offline - relay state unchanged.\n", http.errorToString(httpResponseCode).c_str());
    current_led_status = LED_ERROR;
  }

  http.end();
}

void printAvailableNetworks()
{
  Serial.println("Scanning for available networks...");
  int n = WiFi.scanNetworks();

  if (n == 0)
  {
    Serial.println("No networks found");
  }
  else
  {
    Serial.printf("Available networks (%d found):\n", n);
    for (int i = 0; i < n; ++i)
    {
      Serial.printf("   %s (%d dBm) %s\n",
                    WiFi.SSID(i).c_str(),
                    WiFi.RSSI(i),
                    (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "[Open]" : "[Encrypted]");
    }
  }
  WiFi.scanDelete();
}

void forceWiFiReconnect()
{
  Serial.println("Forcing WiFi reconnection...");
  current_led_status = LED_CONNECTING;
  WiFi.disconnect();
  delay(1000);
  last_reconnect_attempt = 0;
  wifi_retry_count = 0;
  connectToWiFi();
}