var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var mysql = require('mysql');
var schedule = require('node-schedule');

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
            init(event.sender.id, event.message.text);
            console.log("events: ", events);
        } else {
            if (event.postback && event.postback.payload) {
                init(event.sender.id, event.postback.payload);
            }
        }
    }
    res.sendStatus(200);
});

function init(kuldoId, message) {
    console.log("init", message);
    if (message == "start") {
        placeUserIntoDb(kuldoId);
    } else {
        connection.query("SELECT * from myUsers where messageId = '" + kuldoId + "'", function(err, rows, field) {
            if (rows[0].last_command == "name") {
                connection.query("UPDATE myUsers SET name ='" + message + "' where messageId = '" + kuldoId + "';");
                askForSub(kuldoId, message);
                return;
            }
            if (rows[0].last_command == "sub" && message == "igen") {
                connection.query("UPDATE myUsers set is_subbed = 1 , last_command = 'time' where messageId = '" + kuldoId + "';");
                askForTime(kuldoId);
                return;
            }
            if (rows[0].last_command == "time" && message == "745") {
                connection.query("UPDATe myUsers set timing = 745, last_command = 'waiting' where messageId = '" + kuldoId + "';");
                sendConfirm(kuldoId);
                return;
            }
            if (rows[0].last_command == "time" && message == "1245") {
                connection.query("UPDATe myUsers set timing = 1245, last_command = 'waiting' where messageId = '" + kuldoId + "';");
                sendConfirm(kuldoId);
                return;
            }
            if (rows[0].last_command == "time" && message == "1645") {
                connection.query("UPDATe myUsers set timing = 1645, last_command = 'waiting' where messageId = '" + kuldoId + "';");
                sendConfirm(kuldoId);
                return;
            }
        })
    }
}

function askForSub(kuldoId, name) {
    connection.query("UPDATE myUsers SET last_command = 'sub' where messageId = '" + kuldoId + "';");
    sendWannaSub(kuldoId, name);
    console.log();
    return;
}

function sendConfirm(kuldoId) {
    console.log();
    connection.query("SELECT name FROM myUsers where messageId = '" + kuldoId + "';", function(err, rows, fields) {
        var msg = "Kedves " + rows[0].name + "! Sikeresen feliratkoztál a The Morning Pug mopszjaira! Amennyiben szeretnél leiratkozni, úgy egyelőre megszívtad, mert most implementálom:)";
        sendMessage(kuldoId, { text: msg });
        return;
    })
}


// generic function sending messages

function placeUserIntoDb(kuldoId) {
    console.log("placing");
    connection.query(("INSERT INTO myUsers (messageId, last_command) values ('" + kuldoId + "','name');"));
    var message = "Milyen névvel szeretnél bekerülni a rendszerbe?";
    sendMessage(kuldoId, { text: message });
    return;
}

function askForTime(kuldoId) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: kuldoId },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Hány órakor szeretnéd megkapni a cuki mopszos képeket?:)",
                        buttons: [{
                            type: "postback",
                            title: "7:45",
                            payload: "745"
                        }, {
                            type: "postback",
                            title: "12:45",
                            payload: "1245"
                        }, {
                            type: "postback",
                            title: "16:45",
                            payload: "1645"
                        }]
                    }
                }
            }
        }
    })
}
console.log(schedule);
var morning = new schedule.RecurrenceRule();
morning.hour = 7;
morning.minute = 45;
var j = schedule.scheduleJob(morning, function() {
    connection.query('SELECT messageId from myUsers where timing = "745"', function(err, rows, fields) {
        if (!err) {
            for (var i = 0; i < rows.length; i++) {
                id = rows[0].messageId;
                message = "Its a timed message";
                sendMessage(id, { text: message });
            }
        }
    })
})
var lunch = new schedule.RecurranceRule();
lunch.hour = 12;
lunch.minute = 45;
var j = schedule.scheduleJob(lunch, function() {
    connection.query('SELECT messageId from myUsers where timing = "1245"', function(err, rows, fields) {
        if (!err) {
            for (var i = 0; i < rows.length; i++) {
                id = rows[0].messageId;
                message = "Its a timed message";
                sendMessage(id, { text: message });
            }
        }
    })
})
var afterwork = new schedule.RecurranceRule();
afterwork.hour = 15;
afterwork.minute = 0;
var j = schedule.scheduleJob(afterwork, function() {
    console.log();
    connection.query('SELECT messageId from myUsers where timing = "1745"', function(err, rows, fields) {
        if (!err) {
            for (var i = 0; i < rows.length; i++) {
                id = rows[0].messageId;
                message = "Its a timed message";
                sendMessage(id, { text: message });
            }
        }
    })
})

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