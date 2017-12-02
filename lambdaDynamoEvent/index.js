console.log('Loading function');

var AWS = require('aws-sdk');
var uuid = require('uuid/v1')
var dynamo = new AWS.DynamoDB.DocumentClient();


/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = function(event, context, callback) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var operation = event.operation


    switch (operation) {
        case 'create':
            var dateStr = new Date().toISOString().substring(0,19) + 'Z';
            event.payload.TableName = 'Events';
            event.payload.Item.eventID = uuid();
            event.payload.Item.creationDate = dateStr;
            dynamo.put(event.payload, callback);

            break;
        case 'scan':
            if (!event.end) {
                event.end = new Date(new Date(event.begin).getTime() + 7 * 24 * 3600 * 1000).toISOString().substring(0, 19) + 'Z';
            }
            var params = {
                "TableName": "Events",
                "ScanFilter": {
                    "startDate": {
                        "ComparisonOperator" : "BETWEEN",
                        "AttributeValueList" : [
                            event.begin,
                            event.end
                        ]
                    }
                }
            }
            dynamo.scan(params, function(err, data) {
              if (err) {
                  console.log(err, err.stack);
                  callback("Dynamo error.", null);
              } // an error occurred
              else  {
                  data.statusCode = 200;
                  data.headers = {
                      "Access-Control-Allow-Origin": "*"
                  }
                  console.log(data);           // successful response
                  callback(null, data);
              }

            });
            break;
        default:
            callback('Unknown operation: ${operation}');
    }

    return null;
};
