"use strict";

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

var detailsArray = new Array();


// Check if directory exists, and create it if it doesn't
function makeDirectory(directory, callback) {
	fs.stat(directory, function(error, stats) {
		//check if error and the code is 'not exists'
		console.log('errno = ' + error.code);
		if (error && error.code === 'ENOENT') {
			//create the directory, call the callback
			fs.mkdir(directory, callback);
		} else {
			// for different errors
			callback(error);
		}
	});
}


// Scrape the details
function scrapeDetails(thisUrl, body) {
	var $ = cheerio.load(body);
	
	var details = {
		'price': $(body).find('div.shirt-details span.price').text(),
		'title': $(body).find('div.shirt-details h1').text().slice(4),
		'url': thisUrl,
		'imageUrl': $(body).find('div.shirt-picture img').attr('src')
	}
	
    detailsArray.push(details);
}


// Traverse the WebSite
// Start at home page
var url = "http://shirts4mike.com";
request({"uri": url}, function(error, response, body){
	if (error) {
		console.error(error.message);
	} else {
		var $ = cheerio.load(body);
		
		// find all shirts page
		var href = $('li.shirts a').attr('href');
		var thisUrl = url + "/" + href;
		request({"uri": thisUrl}, function(error, response, body) {
			if (error) {
				console.error(error.message);
			} else {
				var $ = cheerio.load(body);
				
				// find all products
				$('ul.products a').each( function() {
					var href = $(this).attr('href');
					var thisUrl = url + "/" + href;
					request({"uri": thisUrl}, function(error, response, body) {
						if (error) {
							console.error(error.message);
						} else {
							
							// scrape all details
							scrapeDetails(thisUrl, body);
							if (detailsArray.length === $('ul.products a').length) {
								
								// make a directory if it doesn't exist
							    makeDirectory("./data/", function(error) {
									if (error) {
										console.error(error.message);
									} else {
										console.log(detailsArray);
									}
								});
							}
						}
					});
				});
			}
		});
	}
}); 

