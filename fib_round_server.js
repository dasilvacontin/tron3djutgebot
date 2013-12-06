console.log("OLA K ASE");
console.log("By @dasilvacontin");

var Crawler = require("crawler").Crawler;
var Twit = require('twit');
var fs = require('fs');
var prompt = require('sync-prompt').prompt;

var currentRound = 35;
var lastMentionDate = 0;
var mentioners = [];

var twCred = {
	consumer_key : undefined,
	consumer_secret : undefined,
	access_token : undefined,
	access_token_secret : undefined
}


try {
	var saveFile = JSON.parse(fs.readFileSync("backup.json", {encoding: 'utf8'}));
	currentRound = saveFile.currentRound;
	lastMentionDate = saveFile.lastMentionDate;
	mentioners = saveFile.mentioners;
	twCred = saveFile.twCred;

} catch (e) {}

function save () {
	var saveFile = {
		currentRound:currentRound,
		lastMentionDate:lastMentionDate,
		mentioners:mentioners,
		twCred:twCred
	};
	try {
		fs.writeFileSync("backup.json", JSON.stringify(saveFile), {encoding:'utf8'});
		console.log("saved backup.json");
	} catch (e) {
		console.log("wow, couldn't write, much fail, very error handling, wow");
	}
}

function getRandomMentioner () {
	return mentioners[Math.floor(Math.random()*mentioners.length)];
}

console.log("Checking Twitter credentials...");
if (twCred.consumer_key == undefined) twCred.consumer_key = prompt('consumer_key: ');
if (twCred.consumer_secret == undefined) twCred.consumer_secret = prompt('consumer_secret: ');
if (twCred.access_token == undefined) twCred.access_token = prompt('access_token: ');
if (twCred.access_token_secret == undefined) twCred.access_token_secret = prompt('access_token_secret: ');

var T = new Twit({
    consumer_key:         twCred.consumer_key
  , consumer_secret:      twCred.consumer_secret
  , access_token:         twCred.access_token
  , access_token_secret:  twCred.access_token_secret
});

/* TEST
T.post('statuses/update', { status: 'hello world!' }, function(err, reply) {
  //  ...
  if (err) console.log(err);
  else console.log("all good");

});
*/

var troll_replies = [];
troll_replies.push(function (username) {
	return "A "+username+" le veo con ganas de que le dedique una ronda.";
});
troll_replies.push(function (username) {
	return "Me va a costar menos acabar con "+username+" que conseguir la independencia de Catalunya";
});
troll_replies.push(function (username) {
	return "Tranquilo, "+username+", en cuanto termine de acariciar al gato empieza tu última ronda";
});
troll_replies.push(function (username) {
	return "¿Ah sí? Pues en la siguiente ronda las motos que choquen con "+username+" tendrán una probabilidad del 100% de sobrevivir";
});
troll_replies.push(function (username) {
	return "Tranquilo "+username+", lo del día aquél que subiste un BFS recursivo queda entre nosotros dos.";
});

function getRandomReplyFunction () {
	return troll_replies[Math.floor(Math.random()*troll_replies.length)];
}

function sendReplyToUsername (username, statusId) {
	var msg = getRandomReplyFunction()(username);
	if (msg == undefined) return;
	setTimeout(function () {
		T.post('statuses/update', { status: msg, in_reply_to_status_id: statusId, include_entities: true}, function(err, reply) {
		  //  ...
		  if (err) {
		  	console.log("error sending: "+msg);
		  	console.log(err);
		  }
		  else console.log("sent: "+msg);

		});
	}, Math.random()*10*1000); //Simulates writting or whatever
}

function reply_n00bs () {

	T.get('search/tweets', { q: "%40tron3djutgebot", count: 100 }, function(err, reply) {
		if (err) return;
		var statuses = reply.statuses;
		var newestDate;
		for (var i = 0; i < statuses.length; ++i) {
			var status = statuses[i];
			var username = "@"+status.user.screen_name;
			var date = +new Date(status.created_at);
			if (i==0) newestDate = date;
			if (lastMentionDate == date) break;
			mentioners.push(username);
			sendReplyToUsername(username, status.id);
		}
		lastMentionDate = newestDate;
	});

	save();

}

function sendTweetAnnouncingRound (round) {
	T.post('statuses/update', { status: "La ronda "+round+ " ha comenzado! Una cerveza y que comience el espectáculo! heuheu" }, function(err, reply) {
	  //  ...
	  if (err) console.log(err);
	  else console.log("sent round announcement");

	});
}

var crawler_callback = function (error, result, $) {
	if (error != undefined) {
		console.log("Error:");
		console.log(error);
	} else {
		var actualRound = $(".part_pal li").length;
		if (actualRound > currentRound) {
			console.log("New round! "+actualRound);
			currentRound = actualRound;
			sendTweetAnnouncingRound(actualRound);
		}
	}
}

var c = new Crawler({
	maxConnections: 1,
	callback: crawler_callback
});

function crawl () {
	c.queue({uri:"https://tron3d-fib.jutge.org/?cmd=rondes", strictSSL:false});
}

setInterval(crawl, 1500);
setInterval(reply_n00bs, 10000);