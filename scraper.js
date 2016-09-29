/**
 * content-scraper
 *
 * Scraps the web site http://shirts4mike.com for Title, Price, ImageURL, and URL of all products.
 * Outputs a CSV file named ./data/YYYY-MM-DD.csv containing Title, Price, ImageURL, URL and Time.
 *
 * @author Steve Masteller
*/
(function(){
"use strict";

/** For accessing the file system */
var fs = require('fs');


/**
 * dependencie: request
 *
 * Used to make http calls
 *
 * reasons for choice:
 *		1. When googling "node.js scraper" the top few articles mention the use of 'request'
 *		2. popular: 4.5 million downloads a week.
 *		3. active:  112 releases, most recent 2 weeks old.
 *		4. lots of contributors: 262
*/
var request = require('request');

/**
 * dependencie "cheerio"
 *
 * node.js implementation of jQuery. Used primarily for the selectors in traversing the web site 
 * and for scraping.
 *
 * reasons for choice:
 *		1. When googling "node.js scraper" the top few articles mention the use of 'cheerio'
 *		2. popular: 600 thousand downloads a week.
 *		3. active:  51 releases, most recent 4 weeks old.
 *		4. lots of contributors: 81
*/
var cheerio = require('cheerio');

/**
 * dependencie "csv-stringify"
 *
 * Used for converting an object into a csv file.
 *
 * reasons for choice:
 *		1. simple and intuitive to use.
 *		2. popular: 370 thousand downloads a week.
 *		3. reasonably active:  13 releases, most recent 5 months old.
 *		4. fair number of contributors: 11
*/
var csv = require('csv-stringify');

/** global array holding details Objects */
var detailsArray = [];

/** 
 * Error Handler
 *
 * Appends an errorMessage of form date + error.message to the scraper-error.log file.
 *	For errors relating to access of the web site being scrapped a console.error message is generated.
 *
 * @param {Boolean} siteDown - Indicates the site may be down
 * @param {String}  message  - Error message from error.message
 * @returns {Null}           - No return
*/
function errorHandler(siteDown, message) {
	
	/** When siteDown write a message to console.error */
	if (siteDown) {
		console.error("http://shirts4mike.com could not be reached. The site or your internet connection may be down.");
	}
	
	/** Construct a log file message from [date]error.message */
	var date = new Date().toString();
	var errorMessage = '[' + date + '] ' + message + '\n';
	
	/** Append the errorMessage to scraper-error.log */
	fs.appendFile('scraper-error.log', errorMessage, function (error) {
		if (error) throw error;
	});
}

/** 
 * get Date
 *
 * @returns {String} the date in the form YYYY-MM-DD
*/
function getDate() {
	var date = new  Date();
	
	var year  = date.getFullYear();
	var month = date.getMonth() + 1;
	var day   = date.getDate();
	
	return year + '-' + month + '-' + day;
}

/** 
 * make directory 
 *
 * Create a directory, if it already exists do nothing.
 *
 * @param {String} directory  - ./data/ in this case
 * @param {function} callback - callback for error propogation
 * @returns {Null}            - No return
*/
function makeDirectory(directory, callback) {
	fs.stat(directory, function(error) {
		
		/** check if error and the code is 'not exists' */
		if (error && error.code === 'ENOENT') {
			
			/** create the directory, call the callback */
			fs.mkdir(directory, callback);
		} else {
			
			/** for different errors */
			callback(error);
		}
	});
}

/** 
 * Scrape the details of a product. 
 *
 * @param {String} thisUrl - in this case http://shirts4mike.com
 * @param {Object} body    - the DOM 
 * @returns {Null}         - No return
*/
function scrapeDetails(thisUrl, body) {
	var $ = cheerio.load(body);
	
	var details = {
		
		/** get Title, slice off the price */
		'Title': $(body).find('div.shirt-details h1').text().slice(4),
		'Price': $(body).find('div.shirt-details span.price').text(),
		'ImageURL': $(body).find('div.shirt-picture img').attr('src'),
		'URL': thisUrl,
		'Time': new Date().toString()
	};
	
    detailsArray.push(details);
}

/** 
 * Traverse the web site, starting at home page.
*/
var url = "http://shirts4mike.com";
request({"uri": url}, function(error, response, body){
	if (error) {
		
		/** an error may be caused by the web site being down */
		errorHandler(true, error.message);
	} else {
		var $ = cheerio.load(body);
		
		/** 
		 * Traverse to the all shirts page.
		*/
		var href = $('li.shirts a').attr('href');
		var thisUrl = url + "/" + href;
		request({"uri": thisUrl}, function(error, response, body) {
			if (error) {
				
				/** an error may be caused by the web site being down */
				errorHandler(true, error.message);
			} else {
				var $ = cheerio.load(body);
				
				/** 
				 * Traverse to all products, cycle ofver each
				*/
				$('ul.products a').each( function() {
					var href = $(this).attr('href');
					var thisUrl = url + "/" + href;
					request({"uri": thisUrl}, function(error, response, body) {
						if (error) {
							
							/** an error may be caused by the web site being down */
							errorHandler(true, error.message);
						} else {
							
							/**
							 * Scrape details of products. 
							 * Join the asynchronous .each calls by comparing the .length
							 * of the detailsArray with the number of products being scraped.
							*/
							scrapeDetails(thisUrl, body);
							if (detailsArray.length === $('ul.products a').length) {
								
								/** make an output directory if it doesn't exist */
								makeDirectory("./data/", function(error) {
									if (error) {
										errorHandler(false, error.message);
									} else {
										
									/** convert the detailsArray to a csv string */
									csv(detailsArray, {"header": true, "quoted": true}, function(error, csvString) {
											if (error) {
												errorHandler(false, error.message);
											} else {
												
												/** write the csv string to a file. of the form ./data/YYYY-MM-DD.csv */
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
