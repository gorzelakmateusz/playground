#include "taskBlinker.h"

void taskBlinker(void * parameter){
    vTaskDelay(500 / portTICK_PERIOD_MS);
    for(;;){
        delay(800);
        Serial.print("\n[taskBlinker] state: ");
        Serial.print(*((uint8_t*)parameter));


        for(uint8_t i=0; i<*((uint8_t*)parameter); ++i){
            digitalWrite(LED_BUILTIN, HIGH);
            delay(100);
            digitalWrite(LED_BUILTIN, LOW);
            delay(100);
        }
    }
}
