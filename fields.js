const request = require('request');
const cheerio = require('cheerio');
const sessioninfo = require('./sessioninfo.js');

//https://utdirect.utexas.edu/apps/registrar/course_schedule/20189/

const login = require('./login.js');

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
  request.get({
    url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/20189/',
    jar: login.jar
  }, function(err, data) {
    if(err) return err;
    console.log("Fetched one");
    request.get({
      url: 'https://login.utexas.edu/login/cdcservlet?goto=https%3A%2F%2Futdirect.utexas.edu%3A443%2Fapps%2Fregistrar%2Fcourse_schedule%2F20189%2F&RequestID=1536628690440&MajorVersion=1&MinorVersion=0&ProviderID=https%3A%2F%2Futdirect.utexas.edu%3A443%2Famagent%3FRealm%3D%2Fadmin%2Futdirect-realm&IssueInstant=2018-09-11T01%3A18%3A10Z',
      jar: login.jar
    }, function(err, data) {
      if(err) return err;
      console.log("Fetched two");
      request.get({
        url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/20189/',
        jar: login.jar
      }, function(err, data) {
        if(err) return err;
        console.log(data);
      });
    });
  });
};

//If this is the main module being run, go through login prompt.
if (require.main === module) {
  login.login(() => {
    setTimeout(function() {exports.get();}, 2000);
  });
}
