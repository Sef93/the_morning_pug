var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var mysql = require('mysql');
var myTimers = require('schedule');

var connection = mysql.createConnection({
    host: 'eu-cdbr-west-01.cleardb.com',
    user: 'b6852e647bd4e8',
    password: '72128df4',
    database: 'heroku_4f4445c9fd24515'
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen((process.env.PORT || 8080));

// Server frontpage
app.get('/', function(req, res) {
    res.send('Es ist uno Testbotto szervero');
});

// Facebook Webhook
app.get('/webhook', function(req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

app.post('/webhook', function(req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            init(event.sender.id, event.message.id);
            console.log("events: ", events);
        } else {
            if (event.postback && event.postback.payload) {
                console.log("payload:", event.postback.payload);
            }
        }
    }
    res.sendStatus(200);
});

function init(kuldoId, message) {
    if (message == "start") {
        placeUserIntoDb(kuldoId);
    }
}

function findMessageBasedOnCommand(kuldoId, command, message) {

}
// generic function sending messages

function placeUserIntoDb(kuldoId) {
    connection.query(("INSERT INTO myUsers (messageId, last_command) values ('" + kuldoId + "','name');"));
    var message = "Milyen névvel szeretnél bekerülni a rendszerbe?";
    sendMessage(kuldoId, { text: message });
    return;
}

function sendWannaSub(recipientId, name) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Szia " + name + "! Szeretnél feliratkozni a The Morning Pugra, és minden nap aranyos mopszos képeket és üzeneteket kapni?",
                        buttons: [{
                            type: "postback",
                            title: "Igen",
                            payload: "igen"
                        }, {
                            type: "postback",
                            title: "Nem",
                            payload: "nem"
                        }]
                    }
                }
            }
        }
    })
}

function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: recipientId },
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};