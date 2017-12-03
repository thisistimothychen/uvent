
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


const handlers = {
    'LaunchRequest': function() {
        this.emit('AMAZON.HelpIntent');
    },
    'ListEvent' : function() {
        const intentObj = this.event.request.intent;
        const dateTime = new DateParse(intentObj.slots.date.value);
        var speechOutput;
        console.log(dateTime);

        const queryBody = {
            operation: 'scan',
            begin: dateTime.startDate.toISOString().substring(0,19) + 'Z',
            end: dateTime.endDate.toISOString().substring(0,19) + 'Z'
        }

        lambda.invoke({
            FunctionName: 'createDynamoEvent',
            Payload: JSON.stringify(queryBody, null, 2)
        }, function (err, data) {
            if (err) {
                speechOutput = "There was an error finding events."
            }
            if(data.Payload){
                body = data.Payload
                speechOutput = "There are " + body.Count + " events I could find. Some interesting ones are ";
                console.log(data.Payload);
            }
            this.emit(':tell', speechOutput);
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
    }
}

exports.handler = function(event, context, callback){
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;

    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
