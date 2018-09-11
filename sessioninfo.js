let ccyys = null;
let utprodid = null;

function fetch() {
  const fs = require('fs');
  let data = fs.readFileSync('session.info', 'utf8');
  let lines = data.split("\n");
  for(let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    let equals = line.indexOf("=");
    let parts = [
      line.substring(0, equals),
      line.substring(equals+1)
    ];
    parts.map(x => x.trim());
    if(parts[0] == "ccyys") {
      ccyys = parts[1];
    } else if(parts[0] == "utlogin-prod") {
      utprodid = parts[1];
    } else {
      console.warn("Unrecognized option in session.info: " + parts[0]);
    }
  }
};

exports.fetchCcyys = function(callback) {
  if(ccyys == null) {
    fetch();
  }
  return ccyys;
};

exports.fetchUtprodid = function(callback) {
  if(utprodid == null) {
    fetch();
  }
  return utprodid;
};
