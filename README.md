# azure-iot-alexa-smart-home-skill

A simple working prototype of Alexa Smart Home Skill that talks to devices on Azure IoT.

This project is a prototype and proof-of-concept, we focus on minimizing the infrastructure and setup cost. For example, to create a new device, you will need to do it manually with [iothub-explorer](https://www.npmjs.com/package/iothub-explorer), modify the `discoveryAppliances.json` and redeploy the package to AWS Lambda.

# Why Azure IoT Hub?

Some cool features of Azure IoT Hub that make it a good fit for Alexa Smart Home Skill:

* Support wide range of secured protocols (MQTT, HTTPS and AMQP)
* Ready-to-use sample code for Arduino, ESP8266 and Raspberry
* [Direct method](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-direct-methods) is a cloud-to-device messaging bus that fit perfectly with Alexa Smart Home Skill API

Since Alexa Smart Home Skill can only talk to AWS Lambda, this prototype runs on AWS Lambda and talks to Azure IoT Hub directly without the need of extra bridge which could increase the latency.

# How to start?

This project is an AWS Lambda function that bridges between Alexa Smart Home Skill and Azure IoT Hub. And it is intended for someone who already have some basic knowledge about Alexa app, AWS Lambda, Azure IoT hub, and programming IoT devices.

## Prerequisites

* Know how to setup Alexa app
* Know how to setup AWS Lambda
* Know how to setup Azure IoT Hub
* Know hot to program an hobby board
  * ESP8266 board: C programming with Arduino IDE
  * Raspberry Pi: Node.js programming with [azure-iot-sdk-for-node](https://github.com/Azure/azure-iot-sdk-node/blob/master/device/core/readme.md)

## Preparation

* Create an Azure IoT Hub
  * Jot down the connection string for service policy, e.g. `HostName=myhome.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=ABCDEFG`
* Create an Alexa App
* Create an AWS Lambda
  * Set environment variable `CUSTOM_CONNSTR_AZURE_IOTHUB` to the IoT Hub connection string
  * Set handler to `index.handler`
  * Make sure it can be [triggered from an Alexa app]((https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/developing-an-alexa-skill-as-a-lambda-function))
* Grab a board of your choice
  * Customize an [IoT Hub client C sample](https://github.com/Azure/azure-iot-sdk-c/tree/master/iothub_client/samples)
  * Direct methods are used to control your device
  * We use [Sparkfun ESP8266 Thing Dev board](https://www.sparkfun.com/products/13711)

# Registering devices

All devices must be registered in `discoveryAppliances.json`. Everytime, you add a new device, you have to redeploy the Lambda function. This file should be very similar to the [response of discover appliances]](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#discoverappliancesresponse).

The following example is the JSON file with one appliance registered, which support turning on/off and setting absolute/relative brightness.

```json
[
  {
    "actions": [
      "decrementPercentage",
      "incrementPercentage",
      "setPercentage",
      "turnOff",
      "turnOn"
    ],
    "additionalApplianceDetails": {},
    "applianceId": "ansluta",
    "friendlyDescription": "IKEA MAGLEHULT LED cabinet/picture lighting",
    "friendlyName": "Hallway light",
    "manufacturerName": "IKEA",
    "modelName": "MAGLEHULT",
    "version": "1.0.0",
    "manufacturer": "IKEA"
  }
]
```

# Direct methods

Direct methods are C2D (cloud-to-device) request-response messages that are used to control device from Alexa. This prototype will translate requests from Alexa into IoT direct methods, and vice versa.

To enable certain functionality of a device (e.g. turn on/off), you must implement both the direct methods and register these actions in `discoverAppliances.json`.

Behaviors of the direct methods should align with [Alexa Smart Home Skill API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference).

## Health check

These APIs enable Alexa to check the health of the device.

### Ping

```js
ping({ now: 1487043909154 })
```

When Alexa is instructed to discover appliances, the lambda function will ping every registered devices (as in `discoverAppliances.json`) for their health status.

If the device cannot be reached or returned non-200, it will be marked by `isReachable` set to `false`.

## Turning device on/off

These APIs enable Alexa to send turn on/off requests to the device.

### Turn on

This method should turn on the device and device should return `200` if success.

```js
turnOn({})
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#turnonrequest).

### Turn off

This method should turn off the device and device should return `200` if success.

```js
turnOff({})
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#turnoffrequest).

## Setting temperature

These APIs enable Alexa to send temperature control requests to the device.

Temperature control requests are designed to control thermostat or HVAC unit, including temperature [in Celsius](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#temperature-control-messages) and mode (auto, cool, heat, away, and other).

### Set temperature

This method should set the temperature to 24 degree Celsius and device should return `200` if success.

```js
setTemperature({
  value: 24
})
```

It should returns

```js
{
  mode     : 'COOL',
  value    : 24,
  prevMode : 'AUTO',
  prevValue: 28
}
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#settargettemperaturerequest).

### Increment temperature

This method should increment the temperature by 4 degree Celsius and device should return `200` if success.

```js
incrementTemperature({
  delta: 4
})
```

It should returns

```js
{
  mode     : 'HEAT',
  value    : 28,
  prevMode : 'AUTO',
  prevValue: 24
}
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#incrementtargettemperaturerequest).

### Decrement temperature

This method should decrement the temperature by 4 degree Celsius and device should return `200` if success.

```js
decrementTemperature({
  delta: 4
})
```

It should returns

```js
{
  mode     : 'AUTO',
  value    : 24,
  prevMode : 'COOL',
  prevValue: 28
}
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#decrementtargettemperaturerequest).

## Setting percentage

These APIs enable Alexa to send percentage-based requests to the device.

### Set percentage

This method should set the percentage and device should return `200` if success.

```js
setPercentage({
  value: 100
})
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#setpercentagerequest).

### Increment percentage

This method should increment the percentage by 10% and device should return `200` if success.

```js
incrementPercentage({
  delta: 10
})
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#incrementpercentagerequest).

### Decrement percentage

This method should decrement the percetnage by 10% and device should return `200` if success.

```js
decrementPercentage({
  delta: 10
})
```

Link to [Alexa API](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/smart-home-skill-api-reference#decrementpercentagerequest).

# Deployment

To deploy, compress the directory as a ZIP file and upload to AWS Lambda.
