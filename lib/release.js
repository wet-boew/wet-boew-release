var path = require('path');
var fs = require('fs');
var uuid = require('node-uuid');
var git = require('./helpers/git');

var devSuffix = '-development',
	coreName = 'wet-boew',
	coreBranch = 'master';

module.exports = function(cwd, callback){
	cwd = cwd ? path.resolve(cwd) : process.cwd();
	callback = callback || function(){};

	var pkgPath = path.join(cwd, 'package.json'),
		bowerPath = path.join(cwd, 'bower.json'),
		pkg = JSON.parse(fs.readFileSync(pkgPath)),
		bower = JSON.parse(fs.readFileSync(bowerPath)),
		oldVersion = pkg.version.match(/v?(\d+)\.(\d+)\.(\d+)(-development)/),
		version = pkg.version.replace(devSuffix, ''),
		newVersion = [oldVersion[0], oldVersion[1], oldVersion[2] + 1].join('.'),
		branchName = uuid.v1(),
		upstream = pkg.repository.url;

	console.log(newVersion);

	git.exec(cwd, ['fetch', upstream, 'master:' + branchName])
	.then(function(){
		return git.exec(cwd, ['checkout', branchName]);
	}).then(function(){
		pkg.version = version;
		bower.version = version;
		if (pkg.name !== coreName){
			bower.devDependencies['wet-boew'] = bower.devDependencies['wet-boew'].replace('#' + coreBranch, '#' + version);
		}

		fs.writeFileSync(pkgPath, JSON.stringify(pkg));
		fs.writeFileSync(bowerPath, JSON.stringify(bower));

		callback();
	});
};
