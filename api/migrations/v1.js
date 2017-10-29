var AWS = require("aws-sdk");

// TODO: Use config module in order to read DB data per environment
AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "zig_zag_dev",
    KeySchema: [
        { AttributeName: "uuid", KeyType: "HASH"}
    ],
    AttributeDefinitions: [
        { AttributeName: "uuid", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
