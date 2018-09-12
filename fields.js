const request = require('request');
const cheerio = require('cheerio');
const sessioninfo = require('./sessioninfo.js');
const entities = require('html-entities');
const querystring = require('querystring');
const login = require('./login.js');
const unique = require('./unique.js');

let fields = [];
let cores = [];
let flags = [];
exports.fields = fields;
exports.cores = cores;
exports.flags = flags;

function addCourseToCourseSetUniquely(set, course) {
  for(let i = 0; i < set.length; i++) {
    if(set[i]["title"] == course["title"]) {
      set[i]["uniques"].push(...course["uniques"]);
      return;
    }
  }
  set.push(course);
}

/* Puts all of set2 into set1 */
function mergeCourseSetsUniquely(set1, set2) {
  for(let i = 0; i < set2.length; i++) {
    addCourseToCourseSetUniquely(set1, set2[i]);
  }
}

/*
 * Loads one page of search results when finding courses that satisfy
 * the core curriculum requirement "core".
 * To load first page, next should be null.
 * Callback is provided with URL of next page of results, should be
 * sent to next argument in subsequent calls. Also passed courses.
 * Populates array courses passed to it.
 */
function loadCourseSearchResultsPage(ccyys, type, options, next, callback) {
  let optionsStr = querystring.stringify(options);
  let url = "https://utdirect.utexas.edu/apps/registrar/course_schedule/"
    + encodeURIComponent(ccyys)
    + (next == null ?
      "/results/?ccyys="
      + encodeURIComponent(ccyys)
      + "&search_type_main="
      + encodeURIComponent(type)
      + (optionsStr == "" ? "" : "&" + optionsStr)
    :
      "/results/" + next);
  request.get({
    url: url,
    jar: login.jar
  }, function(err, data) {
    if(err) throw err;

    const $ = cheerio.load(data['body']);

    if($("div.error").length) {
      console.error("Potential error from page: " + $("div.error").text().trim());
    }

    let children = $("table.results.rwd-table > tbody").children();
    let courses = [];

    //State variables that hold the current information about a course
    let current_course_title = null;
    let current_course_uniques = null;

    //List of courses with information finished
    for(let i = 0; i < children.length; i++) {
      let e = $(children[i]);
      if(e.prop("tagName").toLowerCase() != "tr") {
        //we have something that's not a table throw
        console.warn("Found element: " + e.prop("tagName") + " in tbody" +
          " children. Skipping...");
        continue;
      }

      /*
       * Here's how this part works. There are a series of 'tr's
       * in the element 'table.results.rwd-table > tbody'. Each connection
       * of these 'tr's is used to make a list of all the courses numGrandchilds
       * their uniques. Some 'tr's contain just one child, in which case it
       * is a title 'tr'. Others contain 9 children, which mean they are
       * uniques, and their children have the information about said unique.
       * The title 'tr' comes before all of its unique 'tr's, and then a new
       * title 'tr' comes after to signal that a new list of uniques is coming
       * along as well.
       */

      let numGrandchilds = e.children().length;
      if(numGrandchilds == 1) {
        //this is a title element
        if(current_course_title != null) {
          //push previous course and then start this new course
          courses.push({
            "title": current_course_title,
            "uniques": current_course_uniques
          });
        }
        current_course_title = e.text().trim();
        current_course_uniques = [];
      } else if(numGrandchilds == 9 || numGrandchilds == 8) {
        //this is a unique
        if(current_course_uniques == null) {
          console.error("Unique listed before title in course search.");
          current_course_uniques = [];
        }

        //Generate unique object
        current_course_uniques.push(unique.createUniqueFromElement($, e));
      } else {
        console.warn("Warning: cannot handle tr with " + numGrandchilds + " grandchildren.");
      }
    }

    if(current_course_title != null) {
      //Push whatever course was being filled in before loop ended
      courses.push({
        "title": current_course_title,
        "uniques": current_course_uniques
      });
    }

    callback($("#next_nav_link").attr == undefined ?
      null
      : $("#next_nav_link").attr("href"),
      courses);
  });
}

/*
 * Reads in the index page for the saerch feature on UT's site.
 * It contains information about what possible core credits there are,
 * what fields of study there are, etc. and this scrapes them
 * and populates the arrays fields and cores.
 */
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
  for(let flagindex = 1;; flagindex++) {
    let potentialflag = $("label[for=flag" + flagindex + "]").text();
    if(potentialflag == undefined || potentialflag == "") break;
    else flags.push(potentialflag);
  }
  //console.log(fields[3]);
  let fs = require("fs");
  //saveAllClassesTo(ccyys, "out.json");
  fs.writeFile("data.json", JSON.stringify({"fields": fields, "cores": cores, "flags": flags}), function(e) {});
}

function saveAllClassesTo(ccyys, filename) {
  saveAllClassesToHelper(ccyys, filename, [], 0);
}

function saveAllClassesToHelper(ccyys, filename, courses, index) {
  if(index >= fields.length) {
    let fs = require("fs");
    fs.writeFile(filename, JSON.stringify(courses), function(e) {});
    return;
  }
  loadClassesByField(ccyys, fields[index][0], function(loaded_courses) {
    console.log("Loaded courses in for field: " + fields[index][1]);
    setTimeout(function() {
      //just so we don't spam UT
      mergeCourseSetsUniquely(courses, loaded_courses);
      saveAllClassesToHelper(ccyys, filename, courses, index+1);
    }, 4000);
  });
}

/*
 * Generates a function that repeatedly calsl loadCourseSearchResultsPage
 * to get all pages of results from that search. The new function takes in
 * a ccyys, all options from option array, then a callback.
 */
function generateRepeatedLoadFunction(type, option_names) {
  return function() {
    const ccyys = arguments[0];
    const options = {};
    for(let i = 0; i < option_names.length; i++) {
      options[option_names[i]] = arguments[i+1];
    }
    const callback = arguments[option_names.length+1];
    let master_courses = [];
    loadCourseSearchResultsPage(ccyys, type, options, null, function(n, cs) {
      function nextCore(next, courses_returned) {
        mergeCourseSetsUniquely(master_courses, courses_returned);
        if(next == null) {
          callback(master_courses);
          return;
        }
        loadCourseSearchResultsPage(ccyys, type, options, next, nextCore);
      }
      nextCore(n, cs);
    });
  };
}

let loadClassesByCore = generateRepeatedLoadFunction("CORE", ['core_code']);
let loadClassesByFieldAndLevel = generateRepeatedLoadFunction("FIELD", ['fos_fl', 'level']);

/* I know this is disgusting. Feel free to make it better. */
function loadClassesByField(ccyys, field, callback) {
  loadClassesByFieldAndLevel(ccyys, field, "L", function(courses1) {
    loadClassesByFieldAndLevel(ccyys, field, "U", function(courses2) {
      loadClassesByFieldAndLevel(ccyys, field, "G", function(courses3) {
        mergeCourseSetsUniquely(courses1, courses2);
        mergeCourseSetsUniquely(courses1, courses3);
        callback(courses1);
      });
    });
  });
}

/* Loads all classes that match a certain core curriculum requirement.
function loadClassesByCore(ccyys, courses, core, callback) {
  let options = {"core_code": core};
  loadCourseSearchResultsPage(ccyys, "CORE", options, courses, null, function(n) {
    function nextCore(next) {
      if(next == null) return;
      loadCourseSearchResultsPage(ccyys, "CORE", options, courses, next, nextCore);
    }
    nextCore(n);
  });
}

/* Loads all classes within a certain field.
function loadClassesByField(ccyys, courses, field) {
  loadClassesByFieldAndLevel(ccyys, courses, field, "L");
  loadClassesByFieldAndLevel(ccyys, courses, field, "U");
  loadClassesByFieldAndLevel(ccyys, courses, field, "G");
}

/*
 * Loads all classes that match a certain field and level of study.
 * Level should be one of L ("Lower"), U ("Upper"), or G ("Graduate")

function loadClassesByFieldAndLevel(ccyys, courses, field, level) {
  let options = {"fos_fl": field, "level": level};
  loadCourseSearchResultsPage(ccyys, "FIELD", options, courses, null, function(n) {
    function nextCore(next) {
      if(next == null) return;
      loadCourseSearchResultsPage(ccyys, "FIELD", options, courses, next, nextCore);
    }
    nextCore(n);
  });
}*/

/*
 * Sends LARES data to transfer successful login information from the domain
 * login.utexas.edu to utdirect.utexas.edu (work done by cookie jar). Then,
 * it loads the course schedule's index page, and lets the processMainPage
 * function handle it from there.
 */
function scrape(ccyys, callback) {
  request.get({
    url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/' + ccyys + '/',
    jar: login.jar
  }, function(err, data) {
    if(err) throw err;

    const $ = cheerio.load(data['body']);
    let lares = $("input[name=LARES]").attr('value');
    if(lares == undefined) {
      //could not access LARES variable.
      throw("Could not extract LARES. Check login information"
        + " and network connection, and try again.");
    }
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

exports.saveAllClassesTo = saveAllClassesTo;
