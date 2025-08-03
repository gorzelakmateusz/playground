from kivy.app import App
from kivy.uix.widget import Widget
from kivy.uix.button import Button
from awscrt import mqtt
import sys
import threading
import time
import json
from awsiot import mqtt_connection_builder
from kivy.uix.gridlayout import GridLayout

received_count = 0
received_all_event = threading.Event()
count = 5


class mqttHandler():
    def __init__(self, client_id_p, endpoint_p, port_p, private_key_path_p, ca_path_p, cert_path_p):
        self.received_count = 0
        self.client_id = client_id_p
        self.endpoint = endpoint_p
        self.port = port_p
        self.private_key_path = private_key_path_p
        self.ca_path = ca_path_p
        self.cert_path = cert_path_p

    def on_connection_interrupted(self, connection, error, **kwargs):
        print("Connection interrupted. error: {}".format(error))

    def on_connection_resumed(self, connection, return_code, session_present, **kwargs):
        print("Connection resumed. return_code: {} session_present: {}".format(return_code, session_present))
        if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
            print("Session did not persist. Resubscribing to existing topics...")
            resubscribe_future, _ = connection.resubscribe_existing_topics()
            resubscribe_future.add_done_callback(self.on_resubscribe_complete)

    def on_resubscribe_complete(self, resubscribe_future):
        resubscribe_results = resubscribe_future.result()
        print("Resubscribe results: {}".format(resubscribe_results))
        for topic, qos in resubscribe_results['topics']:
            if qos is None:
                sys.exit("Server rejected resubscribe to topic: {}".format(topic))

    # Callback when the subscribed topic receives a message
    def on_message_received(self, topic, payload, dup, qos, retain, **kwargs):
        print("Received message from topic '{}': {}".format(topic, payload))
        global received_count
        self.received_count += 1
        if self.received_count == count:
            received_all_event.set()

    def create_mqtt_connection(self):
        res = mqtt_connection_builder.mtls_from_path(
            endpoint=self.endpoint,
            # port=self.port,
            cert_filepath=self.cert_path,
            pri_key_filepath=self.private_key_path,
            ca_filepath=self.ca_path,
            # on_connection_interrupted=self.on_connection_interrupted,
            # on_connection_resumed=self.on_connection_resumed,
            client_id=self.client_id,
            clean_session=False,
            keep_alive_secs=30)
            # http_proxy_options=proxy_options)
        return res

class MyGrid(GridLayout):
    def __init__(self, **kwargs):
        super(MyGrid, self).__init__(**kwargs)
        self.cols = 2
        self.btn_up = Button(text="shutters up", font_size=20)
        self.btn_up.bind(on_press=self.pressed_btn_up)
        self.btn_down = Button(text="shutters down", font_size=20)
        self.btn_down.bind(on_press=self.pressed_btn_down)
        self.add_widget(self.btn_up)
        self.add_widget(self.btn_down)
        mqttObj = mqttHandler("phone", "a1tg3e4a8pndpe-ats.iot.eu-west-1.amazonaws.com", 443, "private.pem.key", "ca1.pem", "certificate.pem.crt")
        self.mqtt_connection = mqttObj.create_mqtt_connection()
        print("Connecting to {} with client ID '{}'...".format(mqttObj.endpoint, mqttObj.client_id))
        connect_future = self.mqtt_connection.connect()
        connect_future.result()  # Future.result() waits until a result is available
        print("Connected!")
        message_topic = "esp32-1/sub"
        message_string = "test msg"
        print("Subscribing to topic '{}'...".format(message_topic))
        subscribe_future, packet_id = self.mqtt_connection.subscribe(
            topic=message_topic,
            qos=mqtt.QoS.AT_MOST_ONCE,
            callback=mqttObj.on_message_received)
        subscribe_result = subscribe_future.result()
        print("Subscribed with {}".format(str(subscribe_result['qos'])))
        # if count != 0 and not received_all_event.is_set():  # w8 all msgs to be received. Waits forever if count=0.
        #     print("Waiting for all messages to be received...")
        # received_all_event.wait()
        # print("{} message(s) received.".format(received_count))
        # print("Disconnecting...")
        # disconnect_future = self.mqtt_connection.disconnect()
        # disconnect_future.result()
        # print("Disconnected!")

    def pressed_btn_up(self, i):
        self.mqtt_connection.publish(
            topic="esp32-1/sub",
            payload=json.dumps({"shutters": "roll_up"}),
            qos=mqtt.QoS.AT_MOST_ONCE)

    def pressed_btn_down(self, i):
        self.mqtt_connection.publish(
            topic="esp32-1/sub",
            payload=json.dumps({"shutters": "roll_down"}),
            qos=mqtt.QoS.AT_MOST_ONCE)


class PhoneApp(App):
    # def __init__(self):
    def build(self):
        return MyGrid()


if __name__ == '__main__':
    PhoneApp().run()
