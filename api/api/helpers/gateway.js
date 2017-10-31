'use strict';

const uuidv4 = require('uuid/v4');
const config = require('config');
const Dynamite = require('dynamite');

let TABLE_NAME;
let DYNAMO_CLIENT;

exports.initGateWay = function() {
    if (!DYNAMO_CLIENT) {
      TABLE_NAME = config.get('DynamoDB.table');
      const dynamoSettings = config.get('DynamoDB');
      const options = {
        region: dynamoSettings.region,
        endpoint: dynamoSettings.endPoint,
        accessKeyId: dynamoSettings.accessKeyId,
        secretAccessKey: dynamoSettings.secretAccessKey
      };

      DYNAMO_CLIENT = new Dynamite.Client(options);
    }
}

exports.get = function(uuid, cb) {
    exports.initGateWay();
    return DYNAMO_CLIENT.getItem(TABLE_NAME)
        .setHashKey('uuid', uuid.value)
        .execute()
        .then(function(data) {
            console.info(JSON.stringify(data, null, 2));
            cb(false, data.result);
        });
}

exports.post = function(args, cb) {
    exports.initGateWay();

    console.log("Adding a new item...", args);
    return DYNAMO_CLIENT.putItem(
        TABLE_NAME, {
            uuid: uuidv4(),
            sender: args.sender,
            receiver: args.receiver,
            type: args.type,
            message: args.message,
            createdAt: new Date().getTime()
        })
        .execute()
        .then(function(data) {
          // console.info(JSON.stringify(data, null, 2));
          cb(false, data.result);
        })
        .fail(function(e) {
            // console.info(JSON.stringify(e, null, 2));
            cb(e);
        });
}
