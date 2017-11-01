'use strict';

var awsGateway = require("../helpers/gateway");

const HTTP_CODES = {
  OK: 200,
  BAD_REQUETS: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
module.exports = {
  getFeedbackById: getFeedbackById,
  addFeedbackWithJson: addFeedbackWithJson,
  createFeedbackViaSlack: createFeedbackViaSlack,
  replyFeedbackById: replyFeedbackById
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
        console.log("addFeedbackWithJson succeeded:", JSON.stringify(data, null, 2));
        res.statusCode = HTTP_CODES.OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data, null, 2));
    }
  });
}

function extractFeedbackFromSlackPayload(slackPayload) {
  const REGEX = {
    RECEIVER: /^<@\w+\|?(\w+)>{1}/g,
    TYPE: /(?: +\:\) +)|(?: +\:\( +)/g,
    MESSAGE: /((?: +\:\) +)|(?: +\:\( +))(.{1,140})/g
  };
  const receiver = REGEX.RECEIVER.exec(slackPayload.text)[1];
  const type = slackPayload.text.match(REGEX.TYPE)[0].trim();
  const message = REGEX.MESSAGE.exec(slackPayload.text)[2];
  const sender = slackPayload.user_name;
  return {
    sender,
    receiver,
    type,
    message
  };
}

function createFeedbackViaSlack(req, res) {
  const requestParams = req.swagger.params.body.value;
  const params = extractFeedbackFromSlackPayload(requestParams);
  const feedback = awsGateway.post(params, (err, data) => {
    if (err) {
        // TODO: custom errors dictionary
        res.statusCode = HTTP_CODES.BAD_REQUETS;
        console.error("Error JSON:", JSON.stringify(err, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(err, null, 2));
    } else {
        console.log("createFeedbackViaSlack succeeded:", JSON.stringify(data, null, 2));
        res.statusCode = HTTP_CODES.OK;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data, null, 2));
    }
  });
}

function getFeedbackById(req, res) {
    const feedback = awsGateway.get(req.swagger.params.uuid, (err, data) => {
      if (err) {
          //TODO: custom errors dictionary
          // res.statusCode = 500;
          console.error("Error JSON:", JSON.stringify(err, null, 2));
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = HTTP_CODES.BAD_REQUETS;
          res.end(JSON.stringify(err, null, 2));
      } else {
          console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
          res.statusCode = HTTP_CODES.OK;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data, null, 2));
      }
    });
}


function replyFeedbackById(req, res) {
  const feedback = awsGateway.get(req.swagger.params.uuid, (err, data) => {
    if (data == undefined) {
        err = {
          message: 'Feedback does not exists'
        }
    }

    if (!err) {
      data.reply = req.swagger.params.reply.value;
      
      feedback = awsGateway.update(data, (err, data) => {
        if (!err) {

          console.log("Update item succeeded:", data);
          
          res.statusCode = HTTP_CODES.OK;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data, null, 2));
        }
      });
      
    } 

    if (err) {
      //TODO: custom errors dictionary
      // res.statusCode = 500;
      console.error("Error JSON:", JSON.stringify(err, null, 2));
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = HTTP_CODES.BAD_REQUETS;
      res.end(JSON.stringify(err, null, 2));
    }
  });
}
