const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const replacements = {
  ' p-10': ' p-6 md:p-10',
  ' p-12': ' p-6 md:p-12',
  ' p-16': ' p-8 md:p-16',
  ' p-20': ' p-8 md:p-20',
  ' gap-10': ' gap-6 md:gap-10',
  ' gap-12': ' gap-6 md:gap-12',
  ' gap-16': ' gap-8 md:gap-16',
  ' gap-20': ' gap-8 md:gap-20'
};

walkDir('frontend/src', function(file) {
  if (file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (const [oldClass, newClass] of Object.entries(replacements)) {
      // Create a regex that looks for the old class preceded by a quote, backtick, or space
      // and followed by a space, quote, or backtick.
      // E.g. /([ "'`])p-10([ "'`])/g
      // But we just use regex to replace safe matches that aren't already preceded by md: etc
      
      const regex = new RegExp(`(?<!md:|lg:|xl:|sm:)${oldClass}(?=[ "'\`])`, 'g');
      content = content.replace(regex, newClass);
    }

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed padding/gaps in', file);
    }
  }
});
