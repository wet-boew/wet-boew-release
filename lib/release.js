var path = require('path');
var fs = require('fs');
var uuid = require('node-uuid');

var devSuffix = '-development',
	coreName = 'wet-boew',
	coreBranch = 'master',
	JSONSpaces = 2;

module.exports = function(git, callback, autoclean){
	callback = callback || function(){};
	autoclean = autoclean === undefined ? true : autoclean === true;

	var pkgPath = path.join(git.cwd, 'package.json'),
		bowerPath = path.join(git.cwd, 'bower.json'),
		branchName = uuid.v1(),
		pkg, bower, oldVersion, version, newVersion, upstream;

	var errorLog = function(error){
		callback(error);
	},

	cleanup = function(callback) {
		callback = callback || function(){};

		git.exec('checkout', 'master')
		.then(function() {
			return git.exec('branch', '-D', branchName);
		}, errorLog)
		.then(function() {
			callback();
		}, errorLog);
	},

	writeFiles = function() {
		try {
			fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, JSONSpaces));
			fs.writeFileSync(bowerPath, JSON.stringify(bower, null, JSONSpaces));
		} catch (err) {
			errorLog(err);
		}
	},

	gitAdd = function() {
		return git.exec('add', 'package.json', 'bower.json');
	};

	try {
		pkg = JSON.parse(fs.readFileSync(pkgPath));
		bower = JSON.parse(fs.readFileSync(bowerPath));
	} catch (err) {
		return errorLog(err);
	}

	if (!pkg.version) {
		return errorLog(new Error('Version not found in package.json'));
	}

	if (!pkg.repository || !pkg.repository.url) {
		return errorLog(new Error('Repository URL not found in package.json'));
	}

	oldVersion = pkg.version.match(/v?(\d+)\.(\d+)\.(\d+)(-development)/);
	version = pkg.version.replace(devSuffix, '');
	newVersion = [oldVersion[1], oldVersion[2], parseInt(oldVersion[3]) + 1].join('.') + devSuffix;
	upstream = pkg.repository.url;

	git.exec('fetch', upstream, 'master:' + branchName)
	.then(function(){
		return git.exec('checkout', branchName);
	}, errorLog).then(function(){
		pkg.version = version;
		bower.version = version;

		if (pkg.name !== coreName){
			bower.devDependencies['wet-boew'] = bower.devDependencies['wet-boew'].replace('#' + coreBranch, '#' + version);
		}

		writeFiles();
	}, errorLog)
	.then(gitAdd, errorLog)
	.then(function() {
		return git.exec('commit', '-m', 'Updated files for the v' + version + ' maintenance release');
	}, errorLog)
	.then(function() {
		return git.exec('tag', '-a', 'v' + version, '-m', 'Source files for the v' + version + ' maintenance release');
	}, errorLog)
	.then(function() {
		pkg.version = newVersion;
		bower.version = newVersion;

		if (pkg.name !== coreName){
			bower.devDependencies['wet-boew'] = bower.devDependencies['wet-boew'].replace('#' + version, '#' + coreBranch);
		}

		writeFiles();
	}, errorLog)
	.then(gitAdd, errorLog)
	.then(function() {
		return git.exec('commit', '-m', 'Updated the build version to v' + newVersion);
	}, errorLog)
	.then(function() {
		return git.exec('push', upstream, branchName + ':' + coreBranch, 'v' + version);
	}, errorLog)
	.then(function(){
		if (autoclean) {
			cleanup(callback);
		} else {
			callback();
		}
	}, errorLog);

	if (!autoclean) {
		return {
			cleanup: cleanup
		};
	}
};
