var express = require('express');  
var bodyParser = require('body-parser');  
var request = require('request');  
var app = express();
var mysql = require('mysql');
var myTimers = require('schedule');

app.use(bodyParser.urlencoded({extended: false}));  
app.use(bodyParser.json());  
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {  
    res.send('Es ist uno Testbotto szervero');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {  
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
			var szoveg = event.message.text;
			var kuldoId = event.sender.id;
			console.log("event: ", event);	
        }else if(event.message && event.message.attachments){
			sendMessage(event.sender.id, {text: "Milyen szép kép"});
		}
    }
    res.sendStatus(200);
});