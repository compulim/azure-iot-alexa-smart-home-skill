'use strict';

const handler = require('./index').handler;

handler({
  header: {
    messageId     : '12345678-1234-5678-abcd-12345678abcd',
    namespace     : 'Alexa.ConnectedHome.Control',
    name          : 'SetPercentageRequest',
    payloadVersion: '2'
  },
  payload: {
    appliance: {
      applianceId: 'ansluta'
    },
    accessToken: '',
    percentageState: {
      value: 50
    }
  }
}, {
  fail: json => {
    console.log('failed');
    console.log(JSON.stringify(json, null, 2));
  },
  succeed: json => {
    console.log('succeeded');
    console.log(JSON.stringify(json, null, 2));
  }
});
