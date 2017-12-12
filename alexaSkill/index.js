
const Alexa = require('alexa-sdk');
const aws = require('aws-sdk');
const DateParse = require('amazon-date-parser')
const APP_ID = 'amzn1.ask.skill.6a4b2fed-9f13-4ddf-9002-6f21f74fb328';

const lambda = new aws.Lambda({
    region: 'us-east-1'
});

const languageStrings = {
    'en' : {
        translation: {
            HELP_MESSAGE : "You can ask me for events on a specific day!",
            STOP_MESSAGE : "Have a good time!"
        }
    },
    'en-US': {
        translation: {
            HELP_MESSAGE : "You can ask me for events on a specific day!",
            STOP_MESSAGE : "Have a good time!"
        }
    }
}

const states = {
    //STARTMODE: '_STARTMODE',
    LISTEDMODE: '_LISTEDMODE'
}

const start_mode_handlers = {

    'LaunchRequest': function() {
        this.emit('AMAZON.HelpIntent');
    },
    'ListEvent' : function() {
        const intentObj = this.event.request.intent;

        if (!intentObj.slots.date.value){
            this.emit(':ask', 'Pleave give me a valid date.', 'Pleave give me a valid date.');
            return;
        }
        const dateTime = new DateParse(intentObj.slots.date.value);
        var speechOutput;
        //console.log(dateTime);

        const queryBody = {
            operation: 'scan',
            begin: dateTime.startDate.toISOString().substring(0,19) + 'Z',
            end: dateTime.endDate.toISOString().substring(0,19) + 'Z'
        }

        let mEmit = this.emit;
        let mHandler = this.handler;
        let mAttributes = this.attributes;
        lambda.invoke({
            FunctionName: 'createDynamoEvent',
            Payload: JSON.stringify(queryBody, null, 2)
        }, function (err, data) {
            if (err) {
                speechOutput = "There was a critical error while finding events."
                mEmit(':tell', speechOutput);
            }
            if(data.Payload){
                body = JSON.parse(data.Payload);
                // console.log(body);
                let num = body.Count;

                if (num === 0){
                    let speechOutput = "I could not find any events during that time.";
                    let repeat = "Are there any other days you are looking for?";

                    mEmit(':ask', speechOutput, repeat);
                }
                else {
                    let savedEvents = [];
                    mHandler.state = states.LISTEDMODE;

                    let speechOutput = "There are " + num + " events I could find. Some interesting ones are ";
                    for (var i = 0; i < 2 && i < num - 1; i++){
                        speechOutput += (i + 1) + ": " + body.Items[i].name + ', '
                        saveState = {
                            'name' : body.Items[i].name,
                            'description' : body.Items[i].description,
                            'startDate' : body.Items[i].startDate
                        };
                        savedEvents.push(saveState);
                    }

                    // console.log(speechOutput);
                    let last = Math.min(num, 2)
                    // console.log(last);
                    // console.log(body.Items);
                    speechOutput += "and " + (last + 1) + ": " +  body.Items[last].name + '. Which one sounds interesting to you?';
                    saveState = {
                        'name' : body.Items[last].name,
                        'description' : body.Items[last].description,
                        'startDate' : body.Items[last].startDate
                    };
                    savedEvents.push(saveState);
                    mAttributes['savedEvents'] = savedEvents;

                    var repeat = "Let me know which event you are interested in."
                    mEmit(':ask', speechOutput, repeat);
                }
                //console.log(data.Payload);
            }
        });
    },
    'AMAZON.HelpIntent' : function (){
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function(){
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function(){
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled' : function(){
        this.emit('AMAZON.HelpIntent');
    }
};

const listed_mode_handlers = Alexa.CreateStateHandler(states.LISTEDMODE, {
    'AMAZON.CancelIntent' : function(){
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.HelpIntent': function() {
        let speechOutput = 'You can ask me about any of the events I just told you.';
        this.emit(':ask', speechOutput, speechOutput);
    },
    'AMAZON.StopIntent': function(){
        this.emit('AMAZON.CancelIntent');
    },
    'AMAZON.RepeatIntent' : function(){

        let savedEvents = this.attributes.savedEvents;
        let num = savedEvents.length;

        let speechOutput = "There are " + num + " events I could find. Some interesting ones are ";
        for (var i = 0; i < 2 && i < num - 1; i++){
            speechOutput += (i + 1) + ": " + savedEvents[i].name + ', '
        }

        // console.log(speechOutput);
        let last = Math.min(num, 2)
        // console.log(last);
        // console.log(body.Items);
        speechOutput += "and " + (last + 1) + ": " +  savedEvents.name + '. Which one sounds interesting to you?';

        var repeat = "Let me know which event you are interested in."
        this.emit(':ask', speechOutput, repeat);
    },
    'DescribeEvent' : function(){
        const intentObj = this.event.request.intent;
        let savedEvents = this.attributes['savedEvents'];

        eventObj = getEventObject(this, savedEvents);
        if (eventObj == null){

            let speechOutput = "Please tell me which event you want to hear about.";
            let reprompt = "You can say: tell me about the first event";
            this.emit(':ask', speechOutput, reprompt);
        }
        else {
            let speechOutput = "The description of the event named " + eventObj.name + " is " + eventObj.description;
            let reprompt = "Would you like to learn more about the events I listed?";
            this.attributes['lastEvent'] = eventObj;
            this.emit(':ask', speechOutput, reprompt);
        }
    },
    'GetEventTime': function(){
        const intentObj = this.event.request.intent;
        let savedEvents = this.attributes['savedEvents'];

        eventObj = getEventObject(this, savedEvents);
        if (eventObj == null){

            let speechOutput = "Please tell me which event you want to hear about.";
            let reprompt = "You can say: tell me about the first event";
            this.emit(':ask', speechOutput, reprompt);
        }
        else {

            d = new Date(eventObj.startDate.replace("Z",""));
            dateWords = d.getHours() % 12 + " " + (d.getMinutes() == 0 ? "o-clock" : d.getMinutes()) + " " + (d.getHours() >= 12 ? "PM" : "AM");
            let speechOutput = eventObj.name + " starts at " + dateWords;
            let reprompt = "Would you like to learn more about the events I listed?";
            this.emit(':ask', speechOutput, reprompt);
        }
    },
    'Unhandled': function(){
        let speechOutput = 'Please ask me about any of the events I just told you.';
        this.emit(':ask', speechOutput, speechOutput);
    }
});

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;

    alexa.resources = languageStrings;
    alexa.registerHandlers(start_mode_handlers, listed_mode_handlers);
    alexa.registerHandlers(listed_mode_handlers);
    alexa.execute();
};

function lev (a, b){
  if(a.length == 0) return b.length;
  if(b.length == 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      }
      else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

function getEventObject (requestObject, savedEvents){

    const intentObj = requestObject.event.request.intent;
    if (intentObj.slots.eventName.value){
        let eventName = intentObj.slots.eventName.value;
        let closestIndex = 0;
        let closestLevDist = lev(eventName, savedEvents[0].name);

        for (let i = 1 ; i < savedEvents.length; i++){
            let dist = lev(eventName, savedEvents[i].name);
            if (dist < closestLevDist){
                closestIndex = i;
                closestLevDist = dist;
            }
        }
        let eventObj = savedEvents[closestIndex];
        return eventObj;
    }
    else if (intentObj.slots.index.value){
        let ordinal = intentObj.slots.index.value
        let index = parseInt(ordinal) - 1;

        let eventObj = savedEvents[index];
        return eventObj;
    }
    else if (requestObject.attributes['lastEvent'] != null){
        return requestObject.attributes['lastEvent'];
    }
    else {
        return null;
    }
}
