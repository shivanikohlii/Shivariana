'use strict';

// Imports dependencies and set up http server
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const 
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  request = require('request'),
  apiai = require('apiai');
  var giphyKey = "F6WSyw0UZiqexa9yV3fDC4tw6seYXXAO"; 
  var dialogFlow = apiai("00840f0c253041fc85622c1829327831");
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

   //Adds support for GET requests to our webhook
   app.get('/webhook', (req, res) => {
   
     // Your verify token. Should be a random string.
     let VERIFY_TOKEN = "12211965-got-this"
  
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

   // Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

     // Gets the body of the webhook event
    let webhook_event = entry.messaging[0];

    // Get the sender PSID
    let sender_psid = webhook_event.sender.id;

    if(webhook_event.message){
      handleMessage(sender_psid, webhook_event.message);
    }else if(webhook_event.postbook){
      handlePostback(sender_psid, webhook_event.postback);
    }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});
   // Handles messages events
function handleMessage(sender_psid, received_message) {
  console.log('In handle message');
  if(received_message.text){
    var intentArray = {}; 
    intentArray = received_message.text.split(",");   
    if(intentArray[0].toLowerCase() == 'gif' ||intentArray[0].toLowerCase() == 'gifs'){
        console.log('In Gif');
        var gifmessage = intentArray[1];
        createMessage(sender_psid, gifmessage);
      }
    else{
      var dialogFlowR = dialogFlow.textRequest(received_message.text, {
      sessionId: 'YOUGOTTHIS'
  });
  dialogFlowR.on('response', function(dfResp) {
      var responseText = dfResp.result.fulfillment.speech;
      var response = {
          "text": "" + responseText
      };
      console.log("Response Text: " + responseText);
      callSendAPI(sender_psid, response);
  });
  dialogFlowR.on('error', function(error) {
      responseText = "LOL SOMETHING WENT WRONG";
      response = {
          "text": "" + responseText
      };
      console.log("Response Text: " + responseText);
  });
  dialogFlowR.end();  
      }
    }

  }
  //sends the response message
  function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }
   // Send the HTTP request to the Messenger Platform
   request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}
function createMessage(sender_psid, keyphrase) {
  var giphyLink = "http://api.giphy.com/v1/gifs/search?q="+keyphrase+"&api_key="+giphyKey+"&limit=1";
  request(giphyLink, function (error, response, body) {
    console.log(response);
    if (!error) {
      console.log("[1/2] Response from giphy received");
      var imgURL = JSON.parse(body).data.url;
      console.log(imgURL);
      if (imgURL) {
         var response_message = {
          "attachment": {
            "type": "image",
            "payload": {
              "url": imgURL
            }
          }
        };
      }
      else {
        var response_message = {
          "attachment": {
            "type": "image",
            "payload": {
              "url": "https://media.giphy.com/media/kQg7fQMvVD5Ha/giphy.gif"
            }
          }
        };
      }
        console.log("[2/2] Message to sender prepared");
        callSendAPI(sender_psid, response_message);
    } else {
      callSendAPI(sender_psid, { text: "Oops, something went wrong" });
    }
  });
}


  
// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}


function sendPayload(sender_psid, payload) {
// Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": payload
  }
  // Send the HTTP request to the Messenger Platform
  request({
  "uri": "https://graph.facebook.com/v2.6/me/messages",
  "qs": { "access_token": PAGE_ACCESS_TOKEN },
  "method": "POST",
  "json": request_body
  }, (err, res, body) => {
  if (!err) {
    console.log('message sent!')
  } else {
    console.error("Unable to send message:" + err);
  }
  }); 
}