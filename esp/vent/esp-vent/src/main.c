#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "driver/gpio.h"
#include "esp_netif.h"
#include "esp_http_client.h"
#include "cJSON.h"

#define STATUS_LED_GPIO GPIO_NUM_2
#define LED_ON 1
#define LED_OFF 0

#define WIFI_SSID "ssid"
#define WIFI_PASS "password"
#define WIFI_MAXIMUM_RETRY 5

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT BIT1

#define RECONNECT_INTERVAL_MS 30000
#define WIFI_CHECK_INTERVAL_MS 5000
#define MONITOR_INTERVAL_MS 60000
#define POOR_SIGNAL_THRESHOLD -85
#define WEAK_SIGNAL_THRESHOLD -80
#define POOR_SIGNAL_COUNT_LIMIT 10
#define REST_CHECK_INTERVAL_MS 5000

#define MAX_HTTP_RECV_BUFFER 512

#define REST_API_URL "http://192.168.31.69:3000/api/esp32-vent/data"
#define DATA_FETCH_URL "http://192.168.31.69:3000/api/esp32-vent/data"

typedef enum
{
    LED_OFF_STATUS,
    LED_CONNECTING,
    LED_CONNECTED,
    LED_ERROR,
    LED_READY
} led_status_t;

static EventGroupHandle_t s_wifi_event_group;
static const char *TAG = "WiFi_Manager";
static const char *VENT_TAG = "VENT_STATE_TASK";
static int s_retry_num = 0;
static int wifi_connected = 0;
static TickType_t last_reconnect_attempt = 0;
static volatile led_status_t current_led_status = LED_OFF_STATUS;

static void wifi_init_sta(void);
static void wifi_event_handler(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data);
static void led_blink_task(void *pvParameters);
static void wifi_monitor_task(void *pvParameters);
static void system_monitor_task(void *pvParameters);
static void connect_to_wifi(void);
static void print_available_networks(void);
static void force_wifi_reconnect(void);
static void check_vent_state_task(void *pvParameters);

void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    gpio_config_t io_conf = {0};
    io_conf.pin_bit_mask = (1ULL << STATUS_LED_GPIO);
    io_conf.mode = GPIO_MODE_OUTPUT;
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.intr_type = GPIO_INTR_DISABLE;
    gpio_config(&io_conf);
    gpio_set_level(STATUS_LED_GPIO, LED_OFF);

    wifi_init_sta();

    xTaskCreate(led_blink_task, "led_task", 4096, NULL, 3, NULL);
    xTaskCreate(wifi_monitor_task, "wifi_task", 4096, NULL, 2, NULL);
    xTaskCreate(system_monitor_task, "monitor_task", 4096, NULL, 1, NULL);
    xTaskCreate(check_vent_state_task, "vent_state_task", 10240, NULL, 2, NULL);

    ESP_LOGI(TAG, "All tasks created successfully");
}

static void wifi_init_sta(void)
{
    wifi_config_t wifi_config;
    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();

    s_wifi_event_group = xEventGroupCreate();

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &wifi_event_handler,
                                                        NULL,
                                                        &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &wifi_event_handler,
                                                        NULL,
                                                        &instance_got_ip));

    memset(&wifi_config, 0, sizeof(wifi_config_t));
    strcpy((char *)wifi_config.sta.ssid, WIFI_SSID);
    strcpy((char *)wifi_config.sta.password, WIFI_PASS);
    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
    wifi_config.sta.pmf_cfg.capable = 1;
    wifi_config.sta.pmf_cfg.required = 0;

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "WiFi initialization completed");
}

static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        ESP_LOGI(TAG, "WiFi started, attempting connection...");
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        wifi_event_sta_disconnected_t *event = (wifi_event_sta_disconnected_t *)event_data;
        ESP_LOGW(TAG, "WiFi disconnected (reason: %d)", event->reason);

        if (s_retry_num < WIFI_MAXIMUM_RETRY)
        {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "Retry %d/%d to connect to AP", s_retry_num, WIFI_MAXIMUM_RETRY);
        }
        else
        {
            ESP_LOGE(TAG, "Failed to connect after %d attempts", WIFI_MAXIMUM_RETRY);
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
        wifi_connected = 0;
        current_led_status = LED_CONNECTING;
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "WiFi connected! IP: " IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        wifi_connected = 1;
        current_led_status = LED_CONNECTED;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

static void led_blink_task(void *pvParameters)
{
    int led_state = 0;
    int i;

    ESP_LOGI(TAG, "LED Task started");

    while (1)
    {
        switch (current_led_status)
        {
        case LED_OFF_STATUS:
            gpio_set_level(STATUS_LED_GPIO, LED_OFF);
            vTaskDelay(pdMS_TO_TICKS(1000));
            break;

        case LED_CONNECTING:
            led_state = !led_state;
            gpio_set_level(STATUS_LED_GPIO, led_state ? LED_ON : LED_OFF);
            vTaskDelay(pdMS_TO_TICKS(200));
            break;

        case LED_CONNECTED:
            gpio_set_level(STATUS_LED_GPIO, LED_ON);
            vTaskDelay(pdMS_TO_TICKS(100));
            gpio_set_level(STATUS_LED_GPIO, LED_OFF);
            vTaskDelay(pdMS_TO_TICKS(1900));
            break;

        case LED_ERROR:
            for (i = 0; i < 3; i++)
            {
                gpio_set_level(STATUS_LED_GPIO, LED_ON);
                vTaskDelay(pdMS_TO_TICKS(100));
                gpio_set_level(STATUS_LED_GPIO, LED_OFF);
                vTaskDelay(pdMS_TO_TICKS(100));
            }
            vTaskDelay(pdMS_TO_TICKS(1000));
            break;

        case LED_READY:
            gpio_set_level(STATUS_LED_GPIO, LED_ON);
            vTaskDelay(pdMS_TO_TICKS(100));
            break;
        }
    }
}

static void wifi_monitor_task(void *pvParameters)
{
    static int poor_signal_count = 0;
    wifi_ap_record_t ap_info;
    esp_err_t err;
    TickType_t current_time;

    ESP_LOGI(TAG, "WiFi Monitor Task started");

    while (1)
    {
        err = esp_wifi_sta_get_ap_info(&ap_info);

        if (wifi_connected && err == ESP_OK)
        {
            if (ap_info.rssi < POOR_SIGNAL_THRESHOLD)
            {
                poor_signal_count++;
                ESP_LOGW(TAG, "Very poor signal: %d dBm (count: %d)", ap_info.rssi, poor_signal_count);

                if (poor_signal_count >= POOR_SIGNAL_COUNT_LIMIT)
                {
                    ESP_LOGW(TAG, "Signal consistently poor, forcing reconnect");
                    force_wifi_reconnect();
                    poor_signal_count = 0;
                }
            }
            else if (ap_info.rssi < WEAK_SIGNAL_THRESHOLD)
            {
                poor_signal_count = 0;
                ESP_LOGD(TAG, "Weak signal: %d dBm", ap_info.rssi);
            }
            else
            {
                poor_signal_count = 0;
                current_led_status = LED_CONNECTED;
            }
        }
        else if (!wifi_connected)
        {
            current_time = xTaskGetTickCount();
            if (current_time - last_reconnect_attempt > pdMS_TO_TICKS(RECONNECT_INTERVAL_MS))
            {
                connect_to_wifi();
            }
            poor_signal_count = 0;
        }

        vTaskDelay(pdMS_TO_TICKS(WIFI_CHECK_INTERVAL_MS));
    }
}

static void system_monitor_task(void *pvParameters)
{
    esp_netif_ip_info_t ip_info;
    esp_netif_t *netif;
    wifi_ap_record_t ap_info;
    const char *quality;

    ESP_LOGI(TAG, "System Monitor Task started");

    while (1)
    {
        if (wifi_connected)
        {
            ESP_LOGI(TAG, "=== System Status Report ===");

            netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");

            if (netif != NULL && esp_netif_get_ip_info(netif, &ip_info) == ESP_OK)
            {
                ESP_LOGI(TAG, "IP: " IPSTR " | Gateway: " IPSTR,
                         IP2STR(&ip_info.ip), IP2STR(&ip_info.gw));
            }

            if (esp_wifi_sta_get_ap_info(&ap_info) == ESP_OK)
            {
                quality = (ap_info.rssi > -50) ? "Excellent" : (ap_info.rssi > -60) ? "Good"
                                                           : (ap_info.rssi > -70)   ? "Fair"
                                                           : (ap_info.rssi > -80)   ? "Weak"
                                                                                    : "Very Weak";

                ESP_LOGI(TAG, "RSSI: %d dBm (%s) | SSID: %s",
                         ap_info.rssi, quality, (char *)ap_info.ssid);
            }

            ESP_LOGI(TAG, "Uptime: %lu sec | Free Heap: %lu bytes",
                     (unsigned long)(xTaskGetTickCount() * portTICK_PERIOD_MS / 1000),
                     (unsigned long)esp_get_free_heap_size());
            ESP_LOGI(TAG, "============================");
        }
        else
        {
            ESP_LOGI(TAG, "WiFi disconnected - system monitoring limited");
        }

        vTaskDelay(pdMS_TO_TICKS(MONITOR_INTERVAL_MS));
    }
}

static void connect_to_wifi(void)
{
    EventBits_t bits;

    last_reconnect_attempt = xTaskGetTickCount();
    current_led_status = LED_CONNECTING;

    ESP_LOGI(TAG, "Attempting WiFi connection to: %s", WIFI_SSID);

    s_retry_num = 0;
    esp_wifi_disconnect();
    vTaskDelay(pdMS_TO_TICKS(1000));
    esp_wifi_connect();

    bits = xEventGroupWaitBits(s_wifi_event_group,
                               WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                               pdTRUE,
                               pdFALSE,
                               pdMS_TO_TICKS(20000));

    if (bits & WIFI_CONNECTED_BIT)
    {
        ESP_LOGI(TAG, "WiFi connection successful");
    }
    else if (bits & WIFI_FAIL_BIT)
    {
        ESP_LOGE(TAG, "WiFi connection failed");
        current_led_status = LED_ERROR;
        print_available_networks();
    }
    else
    {
        ESP_LOGW(TAG, "WiFi connection timeout");
        current_led_status = LED_ERROR;
    }
}

static void print_available_networks(void)
{
    const uint16_t max_aps = 10;
    wifi_ap_record_t ap_info[max_aps];
    uint16_t ap_count = 0;
    uint16_t number = max_aps;
    int i;

    memset(ap_info, 0, sizeof(ap_info));

    esp_wifi_scan_start(NULL, true);
    vTaskDelay(pdMS_TO_TICKS(100));

    esp_err_t err_get_ap = esp_wifi_scan_get_ap_records(&number, ap_info);
    esp_err_t err_get_num = esp_wifi_scan_get_ap_num(&ap_count);

    if (err_get_ap == ESP_OK && err_get_num == ESP_OK)
    {
        ESP_LOGI(TAG, "Available networks (%d found):", ap_count);
        for (i = 0; i < number && i < ap_count; i++)
        {
            ESP_LOGI(TAG, "   %s (%d dBm) %s",
                     (char *)ap_info[i].ssid, ap_info[i].rssi,
                     ap_info[i].authmode == WIFI_AUTH_OPEN ? "[Open]" : "[Encrypted]");
        }
    }
    else
    {
        ESP_LOGW(TAG, "Failed to scan for networks: %s", esp_err_to_name(err_get_ap));
    }
    esp_wifi_scan_stop();
}

static void force_wifi_reconnect(void)
{
    ESP_LOGI(TAG, "Forcing WiFi reconnection...");
    current_led_status = LED_CONNECTING;
    esp_wifi_disconnect();
    last_reconnect_attempt = 0;
    s_retry_num = 0;
}

esp_err_t _http_event_handler(esp_http_client_event_t *evt)
{
    switch (evt->event_id)
    {
    case HTTP_EVENT_ERROR:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_ERROR");
        break;
    case HTTP_EVENT_ON_CONNECTED:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_ON_CONNECTED");
        break;
    case HTTP_EVENT_HEADER_SENT:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_HEADER_SENT");
        break;
    case HTTP_EVENT_ON_HEADER:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_ON_HEADER, key=%s, value=%s", evt->header_key, evt->header_value);
        break;
    case HTTP_EVENT_ON_DATA:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_ON_DATA, len=%d", evt->data_len);
        break;
    case HTTP_EVENT_ON_FINISH:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_ON_FINISH");
        break;
    case HTTP_EVENT_DISCONNECTED:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_DISCONNECTED");
        break;
    case HTTP_EVENT_REDIRECT:
        ESP_LOGD(VENT_TAG, "HTTP_EVENT_REDIRECT");
        break;
    }
    return ESP_OK;
}

void check_vent_state_task(void *pvParameters)
{
    ESP_LOGI(VENT_TAG, "Task started");

    esp_http_client_config_t config = {
        .url = DATA_FETCH_URL,
        .event_handler = _http_event_handler,
        .timeout_ms = 10000,
        .buffer_size = MAX_HTTP_RECV_BUFFER,
        .buffer_size_tx = 128,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client)
    {
        ESP_LOGE(VENT_TAG, "HTTP client init failed. Terminating task.");
        vTaskDelete(NULL);
    }

    char *response_buffer = (char *)malloc(MAX_HTTP_RECV_BUFFER);
    if (!response_buffer)
    {
        ESP_LOGE(VENT_TAG, "Buffer allocation failed. Terminating task.");
        esp_http_client_cleanup(client);
        vTaskDelete(NULL);
    }

    while (1)
    {
        if (!wifi_connected)
        {
            ESP_LOGW(VENT_TAG, "WiFi not connected, skipping HTTP request.");
            vTaskDelay(pdMS_TO_TICKS(1000));
            continue;
        }

        ESP_LOGI(VENT_TAG, "Fetching data from: %s", DATA_FETCH_URL);

        esp_http_client_set_url(client, DATA_FETCH_URL);
        esp_http_client_set_method(client, HTTP_METHOD_GET);

        esp_err_t err = esp_http_client_perform(client);

        if (err == ESP_OK)
        {
            vTaskDelay(pdMS_TO_TICKS(10));

            int status_code = esp_http_client_get_status_code(client);
            int content_length = esp_http_client_get_content_length(client);

            ESP_LOGI(VENT_TAG, "HTTP client reports status: %d, expected length: %d", status_code, content_length);

            if (status_code == 200)
            {
                if (content_length > 0)
                {
                    memset(response_buffer, 0, MAX_HTTP_RECV_BUFFER);

                    int read_len = esp_http_client_read_response(client, response_buffer, MAX_HTTP_RECV_BUFFER - 1);

                    if (read_len > 0)
                    {
                        response_buffer[read_len] = '\0';
                        ESP_LOGI(VENT_TAG, "RAW Response (Status %d, Read %d bytes): '%s'", status_code, read_len, response_buffer);

                        cJSON *root = cJSON_Parse(response_buffer);
                        if (root)
                        {
                            cJSON *value_item = cJSON_GetObjectItemCaseSensitive(root, "value");
                            if (cJSON_IsNumber(value_item))
                            {
                                int retrieved_value = value_item->valueint;
                                if (retrieved_value == 0 || retrieved_value == 1)
                                {
                                    ESP_LOGI(VENT_TAG, "Vent state: %d", retrieved_value);
                                    current_led_status = LED_READY;
                                }
                                else
                                {
                                    ESP_LOGW(VENT_TAG, "Value (%d) not 0 or 1. Check server data.", retrieved_value);
                                    current_led_status = LED_ERROR;
                                }
                            }
                            else
                            {
                                ESP_LOGE(VENT_TAG, "JSON parsing error: 'value' not number or not found.");
                                current_led_status = LED_ERROR;
                            }
                            cJSON_Delete(root);
                        }
                        else
                        {
                            ESP_LOGE(VENT_TAG, "JSON parse failed: %s", cJSON_GetErrorPtr());
                            current_led_status = LED_ERROR;
                        }
                    }
                    else if (read_len == 0)
                    {
                        ESP_LOGW(VENT_TAG, "HTTP response has 200 OK, but no data was read.");
                        current_led_status = LED_ERROR;
                    }
                    else
                    {
                        ESP_LOGE(VENT_TAG, "Error reading HTTP response body: %s", esp_err_to_name(read_len));
                        current_led_status = LED_ERROR;
                    }
                }
                else
                {
                    ESP_LOGW(VENT_TAG, "HTTP response has 200 OK, but Content-Length is 0 or less. Nothing to parse.");
                    current_led_status = LED_READY;
                }
            }
            else
            {
                ESP_LOGE(VENT_TAG, "HTTP GET failed. Status: %d", status_code);
                current_led_status = LED_ERROR;
            }
        }
        else
        {
            ESP_LOGE(VENT_TAG, "HTTP GET request error: %s", esp_err_to_name(err));
            current_led_status = LED_ERROR;
        }

        esp_http_client_close(client);

        vTaskDelay(pdMS_TO_TICKS(REST_CHECK_INTERVAL_MS));
    }

    free(response_buffer);
    esp_http_client_cleanup(client);
    vTaskDelete(NULL);
}