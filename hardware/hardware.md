![connector](../resources/MMCPayloadConnector.png)
# Hardware Of MMCPayloadConnector
MMCPayloadConnector is used for mount payloads to MMC drone  platforms.
The MMCPayloadConnector consists of two parts.  

**MMCPayloadConnector-Drone**  
The MMCPayloadConnector-Drone part is Installed on every MMC drone platforms:
![connector-drone](../resources/connector-drone.png)  
**MMCPayloadConnector-Payload**  
The MMCPayloadConnector-Payload part is used in every payloads whitch can 
mount to MMC drone platforms.This document mainly introduces MMCPayloadConnector-Payload.
![connector-payload](../resources/connector-payload.png)

These two parts are electrically connected by Pogo-Pin when the Dorne and 
Payload system is working:
![working](../resources/connector-working.png)

#Pogo-Pin
![pogopins](../resources/pogopins-1.png)
**Features**

|Item|Desc.|
|---|---|
|Current|3A/pin|
|Resistance|50mΩ MAX|


# Interfaces

|Interface|Signal|Note|
|---|---|---|
|POWER|POWER+,GND|50V 3A|
|CAN|CANH,CANL|2.0 A and 2.0 B Active |
|HDMI|DATA2+,DATA2-,DATA1+,DATA1-,DATA0+,DATA0-,CLOCK+,CLOCK-,CEC,HDMI_GND,HDMI_5V,HGN|Full HD supported|
|NET|TX-,TX+,RX+,RX-|network|
|USB|USB VCC,USB DATA+,USB DATA-|**This USB port only for payload debug**|
|UART|TX,RX,GND|for speaker payload|

# Pins
![pins](../resources/pins.png)

|Pins|Definition|Desc.|
|---|---|---|
|PIN1-PIN3|POWER+|Power 24~50V 150w Max|
|PIN4|VUSB|USB power|
|PIN5|USBD-|USB DATA-|
|PIN6|USBD+|USB DATA+|
|PIN7|CAN1_L|CAN bus|
|PIN8|CAN1_H|CAN bus|
|PIN9|TX+|NET|
|PIN10|TX-|NET|
|PIN11|RX+|NET|
|PIN12|Rx-|NET|
|PIN13|DATA2+|HDMI TMDS|
|PIN14|DATA2-|HDMI TMDS|
|PIN15|DATA1+|HDMI TMDS|
|PIN16|DATA1-|HDMI TMDS|
|PIN17|DATA0+|HDMI TMDS|
|PIN18|DATA0-|HDMI TMDS|
|PIN19|CLOCK+|HDMI TMDS clock|
|PIN20|CLOCK+|HDMI TMDS clock|
|PIN21|CEC|HDMI CEC|
|PIN22|REV|Reserved|
|PIN23|HDMI_GND|HDMI GND|
|PIN24|HDMI_5V|HDMI power +5v|
|PIN25|HGN|Hotplug pins for monitoring the presence of HDMI devices|
|PIN26|NC6|Reserved|
|PIN27|NC5|Reserved|
|PIN28|NC4|Reserved|
|PIN29|RX-|backup of PIN12|
|PIN30|RX+|backup of PIN11|
|PIN31|TX-|backup of PIN10|
|PIN32|TX+|backup of PIN9|
|PIN33|CAN1_H|backup of PIN8|
|PIN34|CAN1_L|backup of PIN7|
|PIN35|NC3|TTL(3.3v) UART RX|
|PIN36|NC2|TTL(3.3v) UART TX|
|PIN37|NC1|TTL(3.3v) UART GND|
|PIN38-PIN40|GND|POWER GND|

# Develop kit


# Dimensions
![working](../resources/dimensions.png)
![working](../resources/dimensions-2.png)



