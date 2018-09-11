const prompt = require('prompt');
const request = require('request');

//Schema for information to prompt the user
let schema = {
  properties: {
    eid: {
      required: true,
      pattern: /^[a-zA-Z\s\-_0-9]+$/,
      message: 'Please enter a valid UT EID'
    },
    password: {
      required: true,
      hidden: true
    }
  }
};

let jar = request.jar();

let loginOptions = {
  url: 'https://login.utexas.edu/login/UI/Login',
  jar: jar,
  form: {
    IDToken1: null, //Username
    IDToken2: null //Password
  }
};

exports.login = function(callback) {
  prompt.start();
  prompt.get(schema, function(err, result) {
    if(err) throw err;
    loginOptions.form.IDToken1 = result.eid;
    loginOptions.form.IDToken2 = result.password;

    request.post(loginOptions, function(err, result) {
      if(err) throw err;

      let cookies = jar.getCookies("https://login.utexas.edu/");
      exports.jar = jar;

      //console.log(result.headers['set-cookie']);

      /*setTimeout(function() {
        request.get({jar: jar, url: 'https://utdirect.utexas.edu/apps/registrar/course_schedule/20189/'}, function(err, result) {
          console.log(result);
        });
      }, 1000);*/
      callback();
    });
  });
};

//If this is the main module being run, go through login prompt.
if (require.main === module) {
    exports.login();
}
