var express = require('express'),
  cons = require('consolidate'),
  nunjucks = require('nunjucks'),
  _ = require('underscore'),
  path = require('path'),
  moment = require('moment');

var Twitter = require('twitter-node-client').Twitter,
	config = {
		"consumerKey":process.env.BLT_KEY,
		"consumerSecret":process.env.BLT_SECRET,
		"accessToken":process.env.BLT_TOKEN,
		"accessTokenSecret":process.env.BLT_TOKEN_SECRET,
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
	matches = /^[^\"]*"([^\"]*)" by ([^\.]*)\.(.*)#booklist$/.exec(text);
	if(!matches || matches.length < 3) {
		console.log(text);
		return false;	
	} else {
		return {
			title:matches[1].trim(),
			author:matches[2].trim(),
			text:matches[3].trim()
		};
	}
}

var convertDate = function(date) {
	var sd = date.split(/\s/);
	var year = parseInt(sd[5]);
	var day = parseInt(sd[2]);
	var month = sd[1];
	var time = sd[3];

	var ds = sd[0] + ', ' + day + ' ' + month + ' ' + year + ' ' + time; 
	return Date.parse(ds);
}

var tweets = require('./booklist');

function getBooks(callback) {


	twitter.getSearch({'q':'from:thetmkay #Read #booklist'}, errorFn, function(data) {
		var json = JSON.parse(data);
		for(var i = 0; i < json.statuses.length; i++) {
			var tweet = json.statuses[i];
			var textblock = processTweetText(tweet.text);
			if(!textblock) {
				continue;
			}
			if(_.find(tweets, function(twt) { return tweet.id === twt.id }) === undefined) {
				tweets.push({
					id: tweet.id,
					title: textblock.title,
					author: textblock.author,
					text: textblock.text,
					date: tweet.created_at
				});
			}
		}
		var books = _.sortBy(tweets, function(twt) {
			var timeSince = convertDate(twt.date);
			return timeSince;
		}).reverse();
		callback(books);
	});
}

/**
 * Configuration
 */

var view_paths = [
  path.join(__dirname,'views'),
  path.join(__dirname, 'node_modules', 'gn_components', 'views'),
  path.join(__dirname, '..', 'gn_components', 'views')
];

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(view_paths));

env.addFilter('date', function(date, format) {
  return moment(new Date(date)).format(format);
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
