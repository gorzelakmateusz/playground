from machine import Pin
from machine import reset
import time
import gc
import network
import socket
import json
import struct
from umqtt.simple import MQTTClient

#  GLOBALS
state = 'init'
time_start = time.ticks_ms()
timer_shutters_up = None
timer_shutters_down = None
# gc.enable()
led = Pin(2, Pin.OUT)
r_up = Pin(23, Pin.OUT)
r_down = Pin(22, Pin.OUT)
net_connection = None


cacert = ''

clicert = ''


#  mqtt related


def handler_shutters():
    global timer_shutters_up
    global timer_shutters_down

    if timer_shutters_up is not None:
        if time.ticks_diff(time.ticks_ms(), time_start) < 30000:
            r_up.on()
        else:
            r_up.off()
            timer_shutters_up = None
    elif timer_shutters_down is not None:
        if time.ticks_diff(time.ticks_ms(), timer_shutters_down) < 30000:
            r_down.on()
        else:
            r_down.off()
            timer_shutters_down = None
    else:
        pass


def sub_cb(topic, msg):
    print(topic, msg)
    #if topic == b'notification' and msg == b'r':
    global timer_shutters_up
    global timer_shutters_down


    if msg == b'up':
        print('in up cond')
        if timer_shutters_up is None:
            r_down.off()
            timer_shutters_down = None
            timer_shutters_up = time.ticks_ms()
            r_up.on()
        elif time.ticks_diff(time.ticks_ms(), time_start) < 30000:
            r_up.on()
        # else:
        #     r_up.off()
        #     timer_shutters_up = None
    elif msg == b'down':
        print('in down cond')
        if timer_shutters_down is None:
            r_up.off()
            timer_shutters_up = None
            timer_shutters_down = time.ticks_ms()
            r_down.on()
        elif time.ticks_diff(time.ticks_ms(), timer_shutters_down) < 30000:
            r_down.on()
        else:
            r_down.off()
            timer_shutters_down = None


client = MQTTClient(client_id='', server='', user='', password='', port=1883)


def mqtt_handler():
    try:
        for i in range (3):
            client.check_msg()
            time.sleep(0.1)
        print('sent')
        handler_shutters()
    except Exception as e:
        print(e)


#  mqtt related END


def info_blinker(count):
    # 1 - init
    # 2 - setup
    # 3 - normal
    # 5 - error
    try:
        time.sleep(1)
        for i in range(0, count):
            led.on()
            time.sleep(0.2)
            led.off()
            time.sleep(0.2)
    except Exception as exc:
        print(exc)


def free(full=False):
    gc.collect()
    F = gc.mem_free()
    A = gc.mem_alloc()
    T = F + A
    P = '{0:.2f}%'.format(F / T * 100)
    if not full:
        return P
    else:
        return ('Total:{0} Free:{1} ({2})'.format(T, F, P))


def seconds_to_hhmmss(seconds):
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return "%d:%d:%d" % (hours, minutes, seconds)


# NVM
def read_cfg_file_to_dict():
    try:
        with open('save.json', 'r') as file:
            return json.load(file)
    except Exception as exc:
        print(exc)


def write_dict_to_cfg_file(dict_to_write):
    print('wdtcf-in')
    try:
        with open('save.json', 'w') as file:
            json.dump(dict_to_write, file)
    except Exception as exc:
        print('wdtcf-in-exc: ', exc)


def update_cfg_file(key_param, value_param):
    try:
        d = read_cfg_file_to_dict()
        d[key_param] = value_param
        write_dict_to_cfg_file(d)
    except Exception as exc:
        print(exc)


# this dict is created just one time, then only values of keys can be updated
def setup_cfg_first_time():
    try:
        # ax = 5/0 # make error
        d = read_cfg_file_to_dict()
        print("dict: ", d)
    except Exception as exc:
        print('rcftd-exc', exc)
        try:
            cfg = {
                "wifi_ssid": "none",
                "wifi_password": "none",
                "device_up_more_than_10s_prev": False
            }
            with open('save.json', 'w') as f:
                pass
            write_dict_to_cfg_file(cfg)
        except Exception as exc:
            print('wdtcf-exc: ', exc)
        else:
            print('wdtcf-ok')
    else:
        if d is None:
            try:
                cfg = {
                    "wifi_ssid": "none",
                    "wifi_password": "none",
                    "device_up_more_than_10s_prev": False
                }
                with open('save.json', 'w') as f:
                    pass
                write_dict_to_cfg_file(cfg)
            except Exception as exc:
                print('wdtcf-exc: ', exc)
            else:
                print('wdtcf-ok')
        else:
            print("flash setup already done")


#  NVM END


def from_system_up_10s_passed():
    if time.ticks_diff(time.ticks_ms(), time_start) > 9000: #lag 10->9s
        return True
    else:
        return False


def setup_state_timer_handler():
    try:
        d = read_cfg_file_to_dict()
        print("#dict# ", d)
        if time.ticks_diff(time.ticks_ms(), time_start) < 10000:
            if d['device_up_more_than_10s_prev'] == True:
                update_cfg_file('device_up_more_than_10s_prev', False)
                print('1')
        else:
            if d['device_up_more_than_10s_prev'] == False:
                update_cfg_file('device_up_more_than_10s_prev', True)
                print('2')
    except Exception as e:
        print('ERR in setup_state_timer_handler: ', e)


########### related to sending/receiving over socket
# BLOB = Binary Large OBject
# msg has to be serialized JSON
def read_blob(sock, size):
    buf = b''
    while len(buf) != size:
        ret = sock.recv(size - len(buf))
        if not ret:
            raise Exception("read_blob error")
        buf += ret
    return buf


def read_long(sock):
    size = struct.calcsize("L")
    data = read_blob(sock, size)
    return struct.unpack("L", data)[0]  # struct.unpack() returns tuple even one element inside


def read_from_socket(sock):
    buffer_size = read_long(sock)
    data = read_blob(sock, buffer_size)
    return json.loads(data)


####################################################


#################################################### MAIN
try:
    setup_cfg_first_time()
    d = read_cfg_file_to_dict()
    local_device_up_more_than_10s_prev = d.get('device_up_more_than_10s_prev')
except Exception as e:
    print('pre-init: ', e)
else:
    while True:
        try:
            time.sleep(1)
            print('UPTIME: ', seconds_to_hhmmss(int(time.ticks_diff(time.ticks_ms(), time_start) / 1000)))
            print('free', free())
            # print('df: ', df)
            setup_state_timer_handler()
            d = read_cfg_file_to_dict()
            if state == 'init':
                print('STATE: init')
                info_blinker(1)
                if d['wifi_ssid'] != 'none':
                    for retry in range(10):
                        try:
                            net_connection = network.WLAN(network.STA_IF)
                            net_connection.active(True)
                            net_connection.connect('', d['wifi_password']) #net_connection.connect(d['wifi_ssid'], d['wifi_password'])

                            client.set_callback(sub_cb)
                            client.connect()
                            client.subscribe(topic='edzia@gmail.com')
                            break
                        except Exception as e:
                            print(e)

                print('local_device_up_more_than_10s_prev: ', local_device_up_more_than_10s_prev)
                print('are_wifi_credentials_in_cfg_file(): ', str(d['wifi_ssid'] != 'none'))
                # print('from_system_up_10s_passed(): ', from_system_up_10s_passed())
                # print('net_connection.isconnected(): ', net_connection.isconnected())
                if (local_device_up_more_than_10s_prev == False and from_system_up_10s_passed() == False) or d['wifi_ssid'] == 'none':
                    state = 'setup'
                else:
                    state = 'normal'
                pass
            elif state == 'setup':
                # net_connection.isconnected() if true, disconnect
                ## jezeli wszedles tutaj i nie zmieniono hasla, wroc do normal
                print('STATE: setup')
                info_blinker(2)
                net_connection = network.WLAN(network.AP_IF)
                net_connection.active(True)
                net_connection.config(password="--", essid="WD_rolety", authmode=network.AUTH_WPA_WPA2_PSK)
                addr = socket.getaddrinfo('0.0.0.0', 3000)[0][-1]
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.bind(addr)
                sock.listen(10)
                clientsock, addr = sock.accept()
                jdata = read_from_socket(clientsock)
                update_cfg_file('wifi_ssid', jdata.get('wifi_ssid'))
                update_cfg_file('wifi_password', jdata.get('wifi_password'))
                sock.close()
                net_connection.active(False)
                state = 'init'
                pass
            elif state == 'normal':
                print('STATE: normal')
                info_blinker(3)

                if net_connection.isconnected():
                    print(str(net_connection.ifconfig()))
                    print('net_connection.isconnected')
                    mqtt_handler()
                    pass
                else:
                    state = 'init'
                # connect_to_db(, download_data_from_server
                # # 0 off 1 half 2 on
            else:
                print('STATE: undefined')
                state = 'init'
        except Exception as e:
            state = 'init'
            info_blinker(5)
            reset()
            print('error: ', e)
