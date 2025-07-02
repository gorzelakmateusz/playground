#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include "taskMqttHandler.h"
#include "customTypes.h"

String msg_shutters = "";
bool controllerDidRequest = false;

shuttersStruct *shuttersStructObj;

void messageHandler(char* topic, byte* payload, unsigned int length)
{
  Serial.print("\n[taskMqttHandler] incoming: ");
  Serial.print(topic);
  
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload);
  String deserializedPayload = doc["msg"];

  if(deserializedPayload == "roll_up"){
    msg_shutters = deserializedPayload;
    Serial.print("\n[taskMqttHandler] msg_shutters: ");
    Serial.print(msg_shutters);
  } else if(deserializedPayload == "roll_down"){
    msg_shutters = deserializedPayload;
    Serial.print("\n[taskMqttHandler] msg_shutters: ");
    Serial.print(msg_shutters);
  } else if(deserializedPayload == "report"){
    controllerDidRequest = true;
    Serial.print("\n[taskMqttHandler] controllerDidRequest: ");
    Serial.print(controllerDidRequest);
  } else if(deserializedPayload == "lfe_1"){
    shuttersStructObj->lfeEnabled = true;
    Serial.print("\n[taskMqttHandler] lfeEnabled: ");
    Serial.print(shuttersStructObj->lfeEnabled);
  } else if(deserializedPayload == "lfe_0"){
    shuttersStructObj->lfeEnabled = false;
    Serial.print("\n[taskMqttHandler] lfeEnabled: ");
    Serial.print(shuttersStructObj->lfeEnabled);
  } else {
    Serial.print("\n[taskMqttHandler] junk received");
  }
}

void taskMqttHandler(void * parameter){
    vTaskDelay(6000 / portTICK_PERIOD_MS);
    WiFiClientSecure net = WiFiClientSecure();
    PubSubClient client(net);
    StaticJsonDocument<200> doc;
    char jsonBuffer[512];
    bool shuttersDownPrev = ((shuttersStruct *)parameter)->shuttersDown;
    net.setCACert(AWS_CERT_CA);
    net.setCertificate(AWS_CERT_CRT);
    net.setPrivateKey(AWS_CERT_PRIVATE);
    client.setServer(AWS_IOT_ENDPOINT, 8883);
    client.setCallback(messageHandler);
    shuttersStructObj = (shuttersStruct*)parameter;

    for(;;){
        delay(1000);
        if(!client.connected()){
          Serial.print("\n[taskMqttHandler] AWS IoT Not connected trying to connect.");
          if(client.connect(THINGNAME)){
            Serial.print("\n[taskMqttHandler] AWS IoT Connected!");
            Serial.print("\n[taskMqttHandler] Client subscribed: ");
            Serial.print(client.subscribe(AWS_IOT_SUBSCRIBE_TOPIC));
          }
        }
        Serial.println("\n[taskMqttHandler] Lux from sscObj:");
        Serial.print(shuttersStructObj->lightLux);

        Serial.print("\n[taskMqttHandler] Client state: ");
        Serial.print(client.state());
        client.loop();

        if((shuttersDownPrev != ((shuttersStruct *)parameter)->shuttersDown)){
          doc["state"]["reported"]["shuttersDown"] = ((shuttersStruct *)parameter)->shuttersDown;
          serializeJson(doc, jsonBuffer);
          client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
          Serial.print("\n[taskMqttHandler] jsonBuffer: ");
          Serial.print(jsonBuffer);
          shuttersDownPrev = ((shuttersStruct *)parameter)->shuttersDown;
        }

        if(controllerDidRequest){
          doc["state"]["reported"]["shuttersDown"] = ((shuttersStruct *)parameter)->shuttersDown;
          serializeJson(doc, jsonBuffer);
          client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
          controllerDidRequest = false;
        }

        Serial.print("\n[taskMqttHandler] msg_shutters in taskMqttHandler loop: ");
        Serial.print(msg_shutters);
        if(((shuttersStruct *)parameter)->shutters == "" && msg_shutters != ""){
          ((shuttersStruct *)parameter)->shutters = msg_shutters;
        }
        msg_shutters = "";
    }
}
