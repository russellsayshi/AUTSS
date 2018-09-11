const request = require('request');
const cheerio = require('cheerio');
const sessioninfo = require('./sessioninfo.js');
const entities = require('html-entities');

const login = require('./login.js');

let fields = [];
let cores = [];

function loadCorePage(ccyys, code, next, callback) {
  let url = "https://utdirect.utexas.edu/apps/registrar/course_schedule/"
    + ccyys
    + (next == null ?
      "/results/?ccyys="
      + ccyys + "&search_type_main=CORE&core_code=" + code
    :
      "/results/" + next);
  request.get({
    url: url,
    jar: login.jar
  }, function(err, data) {
    if(err) throw err;

    const $ = cheerio.load(data['body']);

    $(".course_header").each(function(i, el) {
      let e = $(el);
      console.log(e.text());
    });

    callback($("#next_nav_link").attr == undefined ?
      null
      : $("#next_nav_link").attr("href"));
  });
}

function processMainPage($, ccyys, callback) {
  $("#fos_cn > option").each(function(i, el) {
    let e = $(el);
    if(e.attr("value") != "") {
      fields.push([e.attr("value"), e.text()]);
    }
  });
  $("#core_code > option").each(function(i, el) {
    let e = $(el);
    if(e.attr("value") != "") {
      cores.push([e.attr("value"), e.text()]);
    }
  });
  console.log(fields);
  console.log(cores);
}

function loadCoreClasses(ccyyss, core) {
  loadCorePage(ccyys, core, null, function(n) {
    function nextCore(next) {
      if(next == null) return;
      loadCorePage(ccyys, core, next, nextCore);
    }
    nextCore(n);
  });
}

function scrape(ccyys, callback) {
  request.get({
    url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/' + ccyys + '/',
    jar: login.jar
  }, function(err, data) {
    if(err) throw err;

    const $ = cheerio.load(data['body']);
    let lares = $("input[name=LARES]").attr('value');
    let action = $("form").attr('action');

    request.post({
      url: action,
      jar: login.jar,
      form: {
        LARES: lares
      }
    }, function(err2, data2) {
      if(err2) throw err2;

      request.get({
        url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/' + ccyys + '/',
        jar: login.jar
      }, function(err3, data3) {
        if(err3) throw err3;

        processMainPage(cheerio.load(data3['body']), ccyys, callback);
      });
    });
  });
}

exports.get = function(callback) {
  scrape(sessioninfo.fetchCcyys(), callback);
};

//If this is the main module being run, go through login prompt.
if (require.main === module) {
  login.login(() => {
    exports.get();
  });
}
