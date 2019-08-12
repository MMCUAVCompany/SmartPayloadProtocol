![protocol](../resources/protocol.png)
# MMC Payload Control Protocol
The purpose of the MMC Payload Control Protocol is to allow users to control 
their payloads by graphical interactive interface which designed by themselves in
MMC drone platforms. Graphical interactive interface is a web page that written in HTML and JavaScript 
language and MMC GSC/MCS loads it on system start. This protocol is used for data 
transmission between payloads and ground stations, Graphical interactive 
interface web pages, MMC drone platform.

*Features* 

* data transmission
* video transmission
* Custom graphical interactive interface
* MMC drone platform state data

# Data Transmission
Payloads can transmit data to the control station(GCS/MCS) and via the flight platform 
use CAN bus in MMCPayloadConnector.
## Physical Layer
CAN bus with standard ID and 1 Mbps baudrate in MMCPayloadConnector.  
**UPLOAD ID**
Payloads sent data to MMC flight platform using CAN message which identifier 
ID length is 11 bits. That message ID called `UPLOAD ID`, the user can customize 
the ID, but the MSB of the ID must be set, that is, the ID range is 0x400-0x7FF.   
**DOWNLOAD ID**
ID of CAN message that MMC flight platform send to payloads is called `DOWNLOAD ID`.
The ID is equal to `UPLOAD ID`&0x3FF,that is, the ID range is 0x000-0x3FF.  

## Transport Layer



