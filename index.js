'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()),
  PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN,
  apiai = require('apiai');


  //var dialogFlow = apiai("9a0b6340452843e0a3d33922d1a11669");

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
    
    let body = req.body;
    //console.log(body);
    // Checks this is an event from a page subscription
    if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhookEvent = entry.messaging[0];
        // Get the sender PSID
        let senderPsID = webhookEvent.sender.id;
        
        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhookEvent.message) {
            handleMessage(senderPsID, webhookEvent.message);        
        } else if (webhookEvent.postback) {
            handlePostback(senderPsID, webhookEvent.postback);
        }

    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
    } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
    }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
    
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "TING_GOES_SKRRAA"
    
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    
    } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
    }
    }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;

    // Check if the message contains text
    if (received_message.text) {    
        console.log("Text from Msg: " + received_message.text);
        console.log("Sender: " + sender_psid);
        var intentArray = {};
        var responseText = "Gadhe kaisa code likha hai, mujhe sar mein dard de raha hai";
        intentArray = received_message.text.split(",");
        
        if (intentArray[0].toLowerCase() == "trello") {
            console.log("Intent: Call to Trello");
            if (intentArray.length > 1 ) {
                if (intentArray[1].toLowerCase() != "help") {
                    var trelloTitle = intentArray[1];
                    var trelloDesc = intentArray[2];
                    var trelloDue = intentArray[3];
                    var trelloType = intentArray[4];
                    responseText = addCard(trelloTitle, trelloDesc, trelloDue, trelloType);
                }
                else {
                    responseText = "Follow this format: Trello, Title, Description, Due Date, Type";
                }
            }

            else {
                responseText = "Follow this format: Trello, Title, Description, Due Date, Type";
            }
            response = {
                "text": "" + responseText
            };
            callSendAPI(sender_psid, response);
        }

        else {
            console.log("Transmiiting Intent")
            var dfReq = dialogFlow.textRequest(received_message.text, {
                sessionId: 'TINGGGGOESSSBAPBAPSKIDDYBAP'
            });
            dfReq.on('response', function(dfResp) {
                responseText = dfResp.result.fulfillment.speech;
                response = {
                    "text": "" + responseText
                };
                console.log("Response Text: " + responseText);
                callSendAPI(sender_psid, response);
            });
            dfReq.on('error', function(error) {
                responseText = "Gadhe Code likhna nahi aata?";
                response = {
                    "text": "" + responseText
                };
                console.log("Response Text: " + responseText);
            });
            dfReq.end();
        }

        // Create the payload for a basic text message
        
    }
    
    // Sends the response message
    
}