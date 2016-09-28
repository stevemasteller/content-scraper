var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');


// Scrape the details
function scrapeDetails(thisUrl, body) {
	var $ = cheerio.load(body);
	
	details = {
		'price': $(body).find('div.shirt-details span.price').text(),
		'title': $(body).find('div.shirt-details h1').text().slice(4),
		'url': thisUrl,
		'imageUrl': $(body).find('div.shirt-picture img').attr('src')
	}
	
	console.log(details);
}


// Traverse the WebSite
// Start at home page
var url = "http://shirts4mike.com";
request({"uri": url}, function(error, response, body){
	if (error) {
		console.error(error.message);
	} else {
		var $ = cheerio.load(body);
		
		// find all shirts pages, happens to be only one
		$('li.shirts a').each( function() {
			var href = $(this).attr('href');
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
								scrapeDetails(thisUrl, body);
							}
						});
					});
				}
			});
		});
	}
});