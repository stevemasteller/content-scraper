(function(){
"use strict";

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var csv = require('csv-stringify');

var detailsArray = [];

// error handler
function errorHandler(siteDown, message) {
	
	if (siteDown) {
		console.error("http://shirts4mike.com could not be reached. The site or your internet connection may be down.");
	}
	
	var date = new Date().toString();
	var errorMessage = '[' + date + '] ' + message + '\n';
	
	fs.appendFile('scraper-error.log', errorMessage, function (error) {
		if (error) throw error;
	});
}

// get todays date
function getDate() {
	var date = new  Date();
	
	var year  = date.getFullYear();
	var month = date.getMonth() + 1;
	var day   = date.getDate();
	
	return year + '-' + month + '-' + day;
}

// Check if directory exists, and create it if it doesn't
function makeDirectory(directory, callback) {
	fs.stat(directory, function(error) {
		//check if error and the code is 'not exists'
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
		'Title': $(body).find('div.shirt-details h1').text().slice(4),
		'Price': $(body).find('div.shirt-details span.price').text(),
		'ImageURL': $(body).find('div.shirt-picture img').attr('src'),
		'URL': thisUrl,
		'Time': new Date().toString()
	};
	
    detailsArray.push(details);
}


// Traverse the WebSite
// Start at home page
var url = "http://shirts4mike.com";
request({"uri": url}, function(error, response, body){
	if (error) {
		errorHandler(true, error.message);
	} else {
		var $ = cheerio.load(body);
		
		// find all shirts page
		var href = $('li.shirts a').attr('href');
		var thisUrl = url + "/" + href;
		request({"uri": thisUrl}, function(error, response, body) {
			if (error) {
				errorHandler(true, error.message);
			} else {
				var $ = cheerio.load(body);
				
				// find all products
				$('ul.products a').each( function() {
					var href = $(this).attr('href');
					var thisUrl = url + "/" + href;
					request({"uri": thisUrl}, function(error, response, body) {
						if (error) {
							errorHandler(true, error.message);
						} else {
							
							// scrape all details
							scrapeDetails(thisUrl, body);
							if (detailsArray.length === $('ul.products a').length) {
								
								// make a directory if it doesn't exist
								makeDirectory("./data/", function(error) {
									if (error) {
										errorHandler(false, error.message);
									} else {
										
									// convert detailsArray to a csv string
									csv(detailsArray, {"header": true, "quoted": true}, function(error, csvString) {
											if (error) {
												errorHandler(false, error.message);
											} else {
												
												// write the csv string to a file.
												fs.writeFile( './data/' + getDate() + '.csv', csvString, function(error) {
													if (error) {
														errorHandler(false, error.message);
													}
												});
											}
										});
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

})();
