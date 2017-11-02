'use strict';

const config = require("config");
const uuidv4 = require('uuid/v4');
const awsGateway = require("../helpers/gateway");
const slackGateway = require("../helpers/slack");

const BOT_NAME = 'zigzag bot';
const TYPE_TOKENS = {
  POSITIVE: ':)',
  NEGATIVE: ':('
};
const HTTP_CODES = {
  OK: 200,
  BAD_REQUETS: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function addFeedbackWithJson(req, res) {
  const params = {
      sender: req.swagger.params.body.value.sender,
      receiver: req.swagger.params.body.value.receiver,
      type: req.swagger.params.body.value.type,
      message: req.swagger.params.body.value.message,
  };
  const feedback = awsGateway.post(params, (err, data) => {
    if (err) {
        // TODO: custom errors dictionary
        res.statusCode = HTTP_CODES.BAD_REQUETS;
        console.error("Error JSON:", JSON.stringify(err, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(err, null, 2));
    } else {
        res.statusCode = HTTP_CODES.OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data, null, 2));
    }
  });
}

function feedbackParamsFromSlackPayload(slackPayload) {
  const FEEDBACK_REGEX = {

    RECEIVER: /^<@(\w+)\|{1}([a-z0-9._-])+>{1}/g,
    TYPE: /(?: +\:\) +)|(?: +\:\( +)/g,
    MESSAGE: /((?: +\:\) +)|(?: +\:\( +))(.{1,140})/g
  };
  const receiverMatch = FEEDBACK_REGEX.RECEIVER.exec(slackPayload.text);
  console.info("receiverMatch");
  console.info(receiverMatch);
  const receiverId = receiverMatch[1];
  const receiverName = receiverMatch[2];
  const type = slackPayload.text.match(FEEDBACK_REGEX.TYPE)[0].trim();
  const message = FEEDBACK_REGEX.MESSAGE.exec(slackPayload.text)[2];
  const senderName = slackPayload.user_name;
  const senderId = slackPayload.user_id;
  const teamId = slackPayload.team_id;
  const responseUrl = slackPayload.response_url;
  return {
    message,
    responseUrl,
    receiverName,
    receiverId,
    senderId,
    senderName,
    teamId,
    type,
  };
}

const feedbackFromParams = (params) => ({
  uuid: uuidv4(),
  message: params.message,
  responseUrl: params.responseUrl,
  receiverName: params.receiverName,
  receiverId: params.receiverId,
  senderId: params.senderId,
  senderName: params.senderName,
  teamId: params.teamId,
  type: params.type,
  // @todo: find out why 'reply' is not accepting null or undefined when it should
  //reply: args.reply,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime()
});

function createFeedbackViaSlack(req, res) {
  console.info("createFeedbackViaSlack");
  const requestParams = req.swagger.params.body.value;
  const feedbackParams = feedbackParamsFromSlackPayload(requestParams);
  const newFeedback = feedbackFromParams(feedbackParams);
  awsGateway.post(newFeedback, (err, data) => {
    console.info("awsGateway.post", err, data);
    if (err) {
        // TODO: custom errors dictionary
        res.statusCode = HTTP_CODES.BAD_REQUETS;
        console.error("Error JSON:", JSON.stringify(err, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(err, null, 2));
    } else {
        slackGateway.getImChannels((err, channels) => {
          console.info("slackGateway.getImChannels", err, channels);
          if (err) {
            res.statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
            console.error("Error IMChannel JSON:", JSON.stringify(err, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(err, null, 2));
          } else {

            const receiverIMChannel = channels.find((channel) => channel.user === feedbackParams.receiverId);
            const type = feedbackParams.type === TYPE_TOKENS.POSITIVE ? 'positive' : 'negative';
            const attachmentColor = feedbackParams.type === TYPE_TOKENS.POSITIVE ? 'good' : 'danger';
            const message = `<@${feedbackParams.senderId}|${feedbackParams.senderName}> just sent you a new ${type} Zigzag\n${feedbackParams.message}`;
            // const attachments = [{
            //   'fallback': 'New Zigzag received',
            //   'color': attachmentColor,
            //   'pretext': `<@${feedbackParams.senderId}|${feedbackParams.senderName}> just sent you a new ${type} Zigzag`,
            //   'author_name': feedbackParams.senderName,
            //   // 'author_link': 'http://flickr.com/bobby/',
            //   // 'author_icon': 'http://flickr.com/icons/bobby.jpg',
            //   'title': 'New Zigzag',
            //   'title_link': 'https://api.slack.com/',
            //   'text': feedbackParams.message,
            //   'fields': [
            //       {
            //           'title': 'Type',
            //           'value': type,
            //           'short': false
            //       }
            //   ],
            //   'image_url': 'https://s-media-cache-ak0.pinimg.com/originals/52/b8/34/52b834142471b796d21c0d9399798dbc.png',
            //   // 'thumb_url': 'http://example.com/path/to/thumb.png',
            //   'footer': 'zigzag bot',
            //   'footer_icon': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-Sx7c88wo7rnm7cAjbKhUeV2NfKAHpLf2_sb8fVsTir-Zs8JX',
            //   'ts': new Date().getTime()
            // }];
            slackGateway.postMessage(receiverIMChannel.id, message, BOT_NAME, (err, response) => {
              if (err) {
                res.statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
                console.error("Error postMessage JSON:", JSON.stringify(err, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(err, null, 2));
              } else{
                res.statusCode = HTTP_CODES.OK;
                res.setHeader('Content-Type', 'application/json');
                res.end(`Your Zigzag was sent to <@${feedbackParams.receiverId}|${feedbackParams.receiverName}>`);
              }
            });

          }
        });
    }
  });
}

function getFeedbackById(req, res) {
    awsGateway.get(req.swagger.params.uuid.value, (err, data) => {
      if (err) {
          //TODO: custom errors dictionary
          // res.statusCode = 500;
          console.error("Error JSON:", JSON.stringify(err, null, 2));
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = HTTP_CODES.BAD_REQUETS;
          res.end(JSON.stringify(err, null, 2));
      } else {
          console.log("getFeedbackById succeeded:", JSON.stringify(data, null, 2));
          res.statusCode = HTTP_CODES.OK;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data, null, 2));
      }
    });
}


function replyFeedbackById(req, res) {
  awsGateway.get(req.swagger.params.uuid.value, (err, feedback) => {
    if (err) {
        console.error("Error getting feedback:", JSON.stringify(err, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = HTTP_CODES.BAD_REQUETS;
        res.end(JSON.stringify(err, null, 2));
    } else {
        if (!feedback) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = HTTP_CODES.NOT_FOUND;
          res.end(JSON.stringify({
            message: 'Feedback does not exists'
            }, null, 2)
          );
        } else {
          feedback.reply = req.swagger.params.body.value;
          awsGateway.put(feedback, (err, data) => {
            console.info(`after update: ${err} ${data}`)
            if (err) {
                console.error("Error UPDATING:", JSON.stringify(err, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = HTTP_CODES.BAD_REQUETS;
                res.end(JSON.stringify(err, null, 2));
            } else {
              res.statusCode = HTTP_CODES.OK;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data, null, 2));
            }
          });
        }
    }

    // if (!err) {
    //   data.reply = req.swagger.params.body.value;
    //
    //   feedback = awsGateway.put(data, (err, data) => {
    //     if (!err) {
    //
    //       console.log("Update item succeeded:", data);
    //
    //       res.statusCode = HTTP_CODES.OK;
    //       res.setHeader('Content-Type', 'application/json');
    //       res.end(JSON.stringify(data, null, 2));
    //     }
    //   });
    //
    // }

    // if (err) {
    //   //TODO: custom errors dictionary
    //   // res.statusCode = 500;
    //   console.error("Error JSON:", JSON.stringify(err, null, 2));
    //   res.setHeader('Content-Type', 'application/json');
    //   res.statusCode = HTTP_CODES.BAD_REQUETS;
    //   res.end(JSON.stringify(err, null, 2));
    // }
  });
}

module.exports = {
  getFeedbackById: getFeedbackById,
  addFeedbackWithJson: addFeedbackWithJson,
  createFeedbackViaSlack: createFeedbackViaSlack,
  replyFeedbackById: replyFeedbackById
};
