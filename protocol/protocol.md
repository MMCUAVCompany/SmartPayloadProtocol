# ![protocol](../resources/protocol.png)
The purpose of the MMC Payload Control Protocol is to allow users to control 
their payloads by graphical interactive interface which designed by themselves in
MMC drone platforms. Graphical interactive interface is a web page that written in 
HTML and JavaScript language and MMC GSC/MCS loads it on system start. This protocol 
is used for data transmission between payloads and ground stations, Graphical 
interactive interface web pages and MMC drone platform.

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
the ID, but the MSB of the ID must be set, that is, the ID range is 0x400-0x7FF. The 
`UPLOAD ID` must be different when several payloads working at the same drone platform.   
**DOWNLOAD ID**  
ID of CAN message that MMC flight platform send to payloads is called `DOWNLOAD ID`.
The ID is equal to `UPLOAD ID`&0x3FF, that is, the ID range is 0x000-0x3FF.  

## Transport Layer
Data transmission between payloads and MMC drone platform is based on data frames 
as the units. The maximum length of a data frames is 255+4 bytes. Since a CAN message 
has only 8 bytes at most, a frame of data contains several CAN message.  

**Frame format**  

|FRAME HEAD|FRAME TYPE|DATA LENGTH|DATA|CRC|
|------------------|---------------|-------------------|-------|------|

*Serialization*

*note*  
- FRAME HEAD: Must be ==0xA5==, It means the beginning of a data frame.  
- FRAME TYPE: The type of data frame. Usage will be mentioned below.  
- DATA LENGTH:The length of payload data, must be greater than 1 and less than 255.  
- DATA: payload data.  
- CRC: CRC check result.  



