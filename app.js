var express = require('express'),
  cons = require('consolidate'),
  nunjucks = require('nunjucks'),
  _ = require('underscore'),
  path = require('path'),
  config = require('./config'),
  footer = require('gn-components/footer'),
  GoogleSpreadsheet = require('google-spreadsheet'),
  moment = require('moment');

var bookSheet = new GoogleSpreadsheet(config.google.spreadsheet);

var app = module.exports = express();

var errorFn = function(err, response, body) {
	console.error(`ERROR: ${err}`);
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
	return moment(date,'MMMM DD, YYYY at h:mA').format('l');
}


function getBooks(callback) {
	bookSheet.getRows(1,{'start-index':2,'reverse':false},function(err,rows) {
		if(err) {
			callback(err,null);
		}
		var books = [];
		//go in rev-chrono order
		for(var i = rows.length - 1; i >= 0; i--) {
			var book = processTweetText(rows[i].text);
			book['date'] = convertDate(rows[i].date);
			books.push(book);
		}
		callback(null,books);
	});
}

/**
 * Configuration
 */

var view_paths = [
  path.join(__dirname,'views'),
  footer.views
];

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(view_paths));

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
  	getBooks(function(err,books) {

		if(err) {
			console.error(err);
		}

		res.render('index', {'books':books});
	});
});
