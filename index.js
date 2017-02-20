var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 8080));

var mysql = require('mysql');
var connection = mysql.createConnection({
	host : 'us-cdbr-iron-east-04.cleardb.net',
	user : 'ba24a44322161e',
	password : 'ed40c7d4',
	database: 'heroku_e89c728ba09ba8b'
});
// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
			var szoveg = event.message.text;
			var kuldoId = event.sender.id;
			console.log("event: ", event);
				findBestMessage(kuldoId, szoveg, event.sender.id);			
        }else if(event.message && event.message.attachments){
			sendMessage(event.sender.id, {text: "Milyen szép kép"});
		}
    }
    res.sendStatus(200);
});
function findBestMessage(kuldoId, szoveg, senderId) {
	if (szoveg == "start"){
		var message = "Helló! Milyen e-mail címmel vagy regisztrálva a DynamicAdsOnline rendszerébe?";
		sendMessage(kuldoId, {text: message});
		return;
	}
	if (szoveg.indexOf('@') >= 0 && (hasSpace(szoveg)) == false){
		connection.query('UPDATE myUsers SET messageId = ' + senderId.toString() +' WHERE EMAIL = "'+ szoveg +'"');
		connection.query('UPDATE myUsers SET is_subbed = 1 WHERE EMAIL = "'+ szoveg +'"');
		connection.query('SELECT name FROM myUsers WHERE EMAIL = "'+szoveg+'";', function(err, rows, fields){
			if (!err){
				var message = "Kedves " + rows[0].name + "! Azonosításod megtörtént, az megadott e-mailra megerősítő linket küldtünk. Amennyiben elfogadod, mától A DynamicAdsOnline Chatbotján keresztül is kapsz üzeneteket!";
				sendMessage(kuldoId, {text:message});
				return;
			}else{
				console.log(err);
				return;
			}
		});
	}
	if (szoveg.split(' ')[0] == "send"){
		if (szoveg.split(' ')[1] == "jelszo"){
			var message = "Rendben, üzenetedet kiküldtünk!";
			sendMessage(kuldoId, {text:message});
			var message = "";
			for (var i = 2; i<szoveg.split(' ').length; i++){
					message += szoveg.split(' ')[i] + " ";
				}
			connection.query('SELECT messageId from myUsers where is_subbed = 1 and messageId IS NOT NULL', function(err,rows,fields){
				if(!err){
				for (var i = 0; i<rows.length; i++){
					sendMessage(rows[i].messageId, {text: message});
				}
				console.log("done");
				return;
				}else{
					console.log(err);
					return;
				}
			})
		}
	}
	if (szoveg.split(' ')[0] == "sendPrivate"){
		if (szoveg.split(' ')[1] == "jelszo"){
			if (szoveg.split(' ')[2].indexOf('@') >= 0){
				var message = "";
				for (var i = 3; i<szoveg.split(' ').length; i++){
					message += szoveg.split(' ')[i] + " ";
				}
				var target = szoveg.split(' ')[2];
				console.log(szoveg);
				connection.query('SELECT messageId from myUsers where is_subbed = 1 and messageId is NOT NULL and email = "' + target +'"', function(err, rows, fields){
					if(!err){
						sendMessage(rows[0].messageId, {text: message});
						return;
					}else{
						console.log(err);
						return;
						console.log(err);
					}
				});
			}
		}
	}
	if (szoveg == "buttontest"){
		sendButtonMessage(kuldoId);
	}
};
// generic function sending messages
function sendMessage(recipientId, message) {
	console.log();
	console.log();
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
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


function sendButtonMessage(recipientId){
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
		json: {
			recipient:{id: recipientId},
			message: {
				attachment:{
					type: "template",
					payload: {
						template_type: "button",
						text: "Ez egy gomb teszt",
						buttons:[{
							type: "web_url",
							url: "https://www.reddit.com",
							title: "Reddit Link"
						},{
							type: "postback",
							title: "start",
							payload: "start"
						}]
					}
				}
			}
		}
	})
}
function hasSpace(szoveg){
	for (var i = 0; i<szoveg.length; i++){
		if(szoveg[i] == ' '){
			return true;
		}
	}
	return false;
}
