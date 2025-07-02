#include "taskLightSensor.h"
#include "customTypes.h"

void taskLightSensor(void * parameter){
  uint16_t adc_read;
  uint16_t lux = 0;
  point left;
  point right;
  vTaskDelay(3000 / portTICK_PERIOD_MS);
  
  for(;;){
    delay(1000);
    adc_read = analogRead(LIGHT_PIN);
    left = points[0];
    right = points[0];
    //find left and right point based on KY018 output
    for(uint8_t i = 0; i < LIGHT_METER_SAMPLES_COUNT; i++){
      if(adc_read <= points[i].x) {
        left = points[i];
        if(i<LIGHT_METER_SAMPLES_COUNT-1){right = points[i+1];} else {right = points[i];}
        break;
      }
    }

    try{
      lux = (left.y + (((right.y - left.y) / (right.x - left.x)) * (adc_read - left.x)));
      *((uint16_t *)parameter) = lux;
    }
    catch(const std::exception& e){
      Serial.print("\n[taskLightSensor] Catch exception: ");
      Serial.print(e.what());
    }
  }
}

//odwijanie stosu
