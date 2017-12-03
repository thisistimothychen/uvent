const request = require('request');

module.exports.scrapeEvents = (event, context, callback) => {
  var count = 10;
  const url = "http://umd.bwcs-hosting.com/feeder/main/eventsFeed.do?f=y&sort=dtstart.utc:asc&fexpr=(categories.href!=%22/public/.bedework/categories/sys/Ongoing%22%20and%20categories.href!=%22/public/.bedework/categories/Campus%20Bulletin%20Board%22)%20and%20(entity_type=%22event%22%7Centity_type=%22todo%22)&skinName=list-json&count=" + count;

  var end = new Date();
  end.setMonth(end.getMonth() + 1);
  var getEventsUrl = "https://8ifco0noyd.execute-api.us-east-1.amazonaws.com/prod/events?begin=" + (new Date()).toISOString().substring(0,19)+'Z' + "&end=" + end.toISOString().substring(0,19)+'Z';
  request.get(getEventsUrl, (error, res, body) => {
    eventNames = {};
    bodyJSON = JSON.parse(body);
    for(var i = 0; i < bodyJSON['Items'].length; i++) {
      const e = bodyJSON['Items'][i];
      eventNames[e['name']] = true;
    }

    request.get(url, (error, response, body) => {
      let data = JSON.parse(body);

      const events = [];

      var convertToDate = function(utcdate) {
        return utcdate.substring(0,4) + '-' + utcdate.substring(4,6) + '-' + utcdate.substring(6,8) + utcdate.substring(8,11) + ":" + utcdate.substring(11,13) + ':' + utcdate.substring(13);
      }

      for (i = 0; i < data['bwEventList']['events'].length; i++) {
        var start = new Date(convertToDate(data['bwEventList']['events'][i]['start']['utcdate']));
        var end = new Date(convertToDate(data['bwEventList']['events'][i]['end']['utcdate']));

        body = {
          'operation': 'create',
          'payload': {
            'Item': {
              'name': data['bwEventList']['events'][i]['summary'],
              'description': data['bwEventList']['events'][i]['description'],
              'location': data['bwEventList']['events'][i]['location']['address'],
              'categories': data['bwEventList']['events'][i]['categories'],
              'startDate': new Date(start).toISOString().substring(0,19)+'Z',
              'endDate': new Date(end).toISOString().substring(0,19)+'Z'
            }
          }
        }
        events.push(body['payload']['Item']);

        // Check to see if event already exists in DB
        if (eventNames[body['payload']['Item']['name']] === undefined) {
          // Event doesn't exist yet: post it to the DB
          var url = "https://8ifco0noyd.execute-api.us-east-1.amazonaws.com/prod/events";
          request.post({
            headers: {'content-type' : 'application/json'},
            url: url,
            body: JSON.stringify(body),
          }, function(error, response, body) {
            console.log('Event added.');
          });
        } else {
          console.log("Event exists.");
        }
      }
    });
  });


};
