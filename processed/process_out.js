const fs = require("fs");

function loadInJSONFromFile(filename) {
  return JSON.parse(fs.readFileSync(filename));
}

const out = loadInJSONFromFile("out.json");
const data = loadInJSONFromFile("data.json");

for(let i = 0; i < out.length; i++) {
  let course = out[i];
  let title = course["title"];
  for(let i = 0; i < data["fields"].length; i++) {
    
  }
}
