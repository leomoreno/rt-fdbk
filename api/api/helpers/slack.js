'use strict';

const querystring = require('querystring');
const config = require('config');
const axios = require('axios');

const apiMethodUrl = (method) => {
  const slackToken = config.get('slack.token');
  const apiUrl = config.get('slack.api_url');
  return `${apiUrl}${method}?token=${slackToken}`
};

exports.getImChannels = function(cb) {
  axios.get(apiMethodUrl('im.list'))
    .then((response) => {
      if (response.data.ok) {
        cb(false, response.data.ims);
      } else {
        console.info(`getImChannels:error: ${JSON.stringify(response.error, null, 2)}`);
        cb(response.error);
      }
    })
    .catch(e =>cb (e));
}

exports.postMessage = function(channel, text, username, cb) {
    axios.post(apiMethodUrl('chat.postMessage'), querystring.stringify({
      channel,
      text,
      // attachments,
      username
    }))
      .then((response) => {
        if (response.data.ok) {
          cb(false, response.data);
        } else {
          console.info(`postMessage:error: ${JSON.stringify(response.data.error, null, 2)}`);
          cb(response.data.error);
        }
      })
      .catch(e => cb(e));
}
