const fs = require('fs');
const path = require('path');

// Root directory of your NestJS project
const SRC_DIR = path.join(__dirname, 'src');

function getAllTsFiles(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach(file => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat && stat.isDirectory()) {
			results = results.concat(getAllTsFiles(filePath));
		} else if (file.endsWith('.ts')) {
			results.push(filePath);
		}
	});
	return results;
}

function fixImports(filePath) {
	let content = fs.readFileSync(filePath, 'utf8');
	const dir = path.dirname(filePath);

	const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
	let modified = false;

	content = content.replace(importRegex, (match, importPath) => {
		if (importPath.startsWith('.') || importPath.startsWith('/')) {
			// Relative path
			const fullPathTs = path.resolve(dir, importPath + '.ts');
			const fullPathIndex = path.resolve(dir, importPath, 'index.ts');

			if (!fs.existsSync(fullPathTs) && fs.existsSync(fullPathIndex)) {
				const fixedPath = importPath.endsWith('/') ? importPath + 'index' : importPath + '/index';
				modified = true;
				console.log(`Fixed import in ${filePath}: ${importPath} -> ${fixedPath}`);
				return match.replace(importPath, fixedPath);
			}
		}
		return match;
	});

	if (modified) {
		fs.writeFileSync(filePath, content, 'utf8');
	}
}

// Run on all TS files
const tsFiles = getAllTsFiles(SRC_DIR);
tsFiles.forEach(fixImports);

console.log('✅ Finished fixing import paths!');
