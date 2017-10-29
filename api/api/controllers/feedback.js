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
  addFeedbackWithJson: addFeedbackWithJson
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function addFeedbackWithJson(req, res) {
  const feedback = awsGateway.post(req.swagger.params, (err, data) => {
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
