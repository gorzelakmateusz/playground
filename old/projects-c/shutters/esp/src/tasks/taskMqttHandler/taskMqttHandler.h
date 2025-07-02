#define AWS_IOT_PUBLISH_TOPIC   "esp32-1/pub"
#define AWS_IOT_SUBSCRIBE_TOPIC "esp32-1/sub"

#define THINGNAME "esp32-1"
// old sub topic esp32-1/sub
static const char AWS_IOT_ENDPOINT[] = "-";
static const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
-
-----END CERTIFICATE-----
)EOF";
static const char AWS_CERT_CRT[] PROGMEM = R"KEY(
-----BEGIN CERTIFICATE-----
-
-----END CERTIFICATE-----
)KEY";
static const char AWS_CERT_PRIVATE[] PROGMEM = R"KEY(
-----BEGIN RSA PRIVATE KEY-----
-
-----END RSA PRIVATE KEY-----
)KEY";


void taskMqttHandler(void * parameter);
