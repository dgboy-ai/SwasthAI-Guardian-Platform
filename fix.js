const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('frontend/src', function(file) {
  if (file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/className=\"([^\"]*)grid grid-cols-2([^\"]*)\"/g, 'className=\"$1grid grid-cols-1 sm:grid-cols-2$2\"');
    newContent = newContent.replace(/className=\{\`([^\`]*)grid grid-cols-2([^\`]*)\`\}/g, 'className={`$1grid grid-cols-1 sm:grid-cols-2$2`}');
    
    // Also fix grid-cols-3
    newContent = newContent.replace(/className=\"([^\"]*)grid grid-cols-3([^\"]*)\"/g, 'className=\"$1grid grid-cols-2 sm:grid-cols-3$2\"');
    newContent = newContent.replace(/className=\{\`([^\`]*)grid grid-cols-3([^\`]*)\`\}/g, 'className={`$1grid grid-cols-2 sm:grid-cols-3$2`}');

    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed', file);
    }
  }
});
