//Properties we expect to find when scraping the website
const unique_properties = [
  "Unique",
  "Days",
  "Hour",
  "Room",
  "Instructor",
  "Status",
  "Flags",
  "Core"
];

const fields = require("./fields.js");

//Takes in a cheerio element and returns a unique object
exports.createUniqueFromElement = function($, element) {
  let unique = {"flags": [], "core": []};

  //Read through all child elements to populate properties of unique
  let children = element.children();
  for(let i = 0; i < children.length; i++) {
    let gc = $(children[i]);
    let property = gc.data("th");

    if(property == "Flags") {
      //List of flags this unique satisfies
      let flags = gc.find("ul.flag").children();
      for(let o = 0; o < flags.length; o++) {
        let flagabbr = $(flags[o]).text().trim();
        if(fields.flags.includes(flagabbr)) {
          unique["flags"].push(flagabbr);
        } else {
          console.warn("Flag '" + flagabbr + "' not found when processing unique.");
        }
      }
    } else if(property == "Core") {
      //List of cores this unique satisfies
      let cores = gc.find("ul.core").children();
      for(let o = 0; o < cores.length; o++) {
        let coreabbr = $(cores[o]).text().trim();
        if(coreabbr == "") continue; //weirdly UT puts empty elements on some
                                     //cores, but not on some flags.
        if(fields.cores.map(x => x[1]).includes(coreabbr)) {
          unique["core"].push(coreabbr);
        } else {
          console.warn("Core '" + coreabbr + "' not found when processing unique.");
        }
      }
    } else if(property == "Unique") {
      unique["unique"] = parseInt(gc.text().trim());
    } else if(property == "Add") {
      //We don't care about this property. Ignore
    } else if(unique_properties.includes(property)) {
      unique[property.toLowerCase()] = gc.text().trim();
    } else {
      console.warn("Property '" + property + "' found in unique but unexpected.");
    }
  }

  //Ensure all properties were found
  for(let i = 0; i < unique_properties.length; i++) {
    if(!unique.hasOwnProperty(unique_properties[i].toLowerCase())) {
      //We did not find the property.
      let prop = unique_properties[i].toLowerCase();
      console.warn("Could not find property: " + prop + ", when making unique.");
      if(prop == "flags" || prop == "core") {
        unique[prop] = [];
      } if(prop == "unique") {
        unique[prop] = 0;
      } else {
        unique[prop] = "";
      }
    }
  }

  return unique;
}
