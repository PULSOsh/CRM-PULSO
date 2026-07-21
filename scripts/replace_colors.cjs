const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '../apps/web/src'));

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace #b3261e
  content = content.replace(/text-\[#b3261e\]/g, 'text-[var(--error)]');
  content = content.replace(/bg-\[#b3261e\]/g, 'bg-[var(--error)]');
  content = content.replace(/border-\[#b3261e\]/g, 'border-[var(--error)]');
  content = content.replace(/bg-\[color:#b3261e\/(.[0-9]+)\]/g, 'bg-[color:var(--error)/$1]');

  // Replace orange-500
  content = content.replace(/text-orange-500/g, 'text-[var(--signal)]');
  content = content.replace(/bg-orange-500/g, 'bg-[var(--signal)]');
  content = content.replace(/border-orange-500/g, 'border-[var(--signal)]');
  content = content.replace(/ring-orange-500/g, 'ring-[var(--signal)]');
  
  // Replace #f97316 or #F97316 (orange-500 hex)
  content = content.replace(/text-\[#f97316\]/ig, 'text-[var(--signal)]');
  content = content.replace(/bg-\[#f97316\]/ig, 'bg-[var(--signal)]');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Done! Modified ${changedFiles} files.`);
