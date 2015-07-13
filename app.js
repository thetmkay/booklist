var express = require('express'),
  cons = require('consolidate'),
  nunjucks = require('nunjucks'),
  _ = require('underscore'),
  path = require('path'),
  moment = require('moment');

var Twitter = require('twitter-node-client').Twitter,
	config = {
		"consumerKey":"QSBn6rcUlCtDigDpkperUXxhj",
		"consumerSecret":"MV3qIRbFy9eaIYLEV014Ri1Iai9t0305tti7g15XUAGByFGfFC",
		"accessToken":"159273941-Qfvtm9j7IAi4QNcYej7tLohjoQN1BggIS4kkdyeN",
		"accessTokenSecret":"U4jYKmH15gHYSah9jmXbv68HclOkeRS7ExWFQ80kBNMgm",
		"callbackUrl":""
	},
	twitter = new Twitter(config);


var app = module.exports = express();

var errorFn = function(err, response, body) {
	console.error(err);
}

var processTweetText = function(text) {
	//text = text.replace(/#Read/, 'Read');
	//text = text.replace(/\s#booklist/, '');
	matches = /^[^\"]*"([^\"]*)" by ([^\.]*)\. (.*) #booklist$/.exec(text);
	return {
		title:matches[1],
		author:matches[2],
		text:matches[3]
	};
}

var tweets = require('./booklist');

function getBooks(callback) {

	console.log(tweets.length);

	twitter.getSearch({'q':'from:thetmkay #Read #booklist'}, errorFn, function(data) {
		var json = JSON.parse(data);
		for(var i = 0; i < json.statuses.length; i++) {
			var tweet = json.statuses[i];
			var textblock = processTweetText(tweet.text);
			if(_.find(tweets, function(twt) { return tweet.id === twt })) {
				tweets.push({
					id: tweet.id,
					title: textblock.title,
					author: textblock.author,
					text: textblock.text,
					date: tweet.created_at
				});
			}
			console.log(textblock.text);
		}
		
		var books = _.sortBy(tweets, 'date').reverse();

		callback(books);
	});
}

/**
 * Configuration
 */

var view_paths = [
  path.join(__dirname,'views'),
];

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(view_paths));

env.addFilter('date', function(date, format) {
  return moment(date).format(format);
});

env.express(app);

// all environments

app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', cons.nunjucks);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
// development only

/**
 * Routes
 */

app.get('/', function(req,res) {
  	getBooks(function(books) {
		res.render('index', {'books':books});
	});
});
