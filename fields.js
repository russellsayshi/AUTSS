const request = require('request');
const cheerio = require('cheerio');
const sessioninfo = require('./sessioninfo.js');

//https://utdirect.utexas.edu/apps/registrar/course_schedule/20189/

const login = require('./login.js');
login.login();

function scrape(prodid, ccyys) {
  request.get({
    url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/20189/',
    jar: login.jar
  }, function(err, data) {
    if(err) return err;
    console.log(data);
  });
}

exports.get = function(callback) {
  scrape(sessioninfo.fetchUtprodid(), sessioninfo.fetchCcyys());
};

//If this is the main module being run, go through login prompt.
if (require.main === module) {
    setTimeout(function() {exports.get();}, 2000);
}
