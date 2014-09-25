var path = require('path');
var fs = require('fs');
var expect = require('expect.js');
var Q = require('q');
var git = require('../lib/helpers/git');
var release = require('../lib/release');
var paths = require('./paths');

describe('Themes Release Process', function () {
	var originPath = paths.originFolder + '/theme',
		origin = new git(originPath),
		upstreamPath = paths.upstreamFolder + '/theme',
		upstream = new git(upstreamPath),
		currentBranchRegexp = /\*\s*([^\n]*)/,
		localBranchName, callback, r;

	var error = function(error) {
		if (callback) {
			callback(error);
		}
	};

	before(function(done) {
		callback = done;

		fs.mkdirSync(upstreamPath);

		upstream.create(true)
		.then(function(stdout, sterr) {
			return origin.create();
		}, error)
		.then(function() {
			return origin.exec('push', upstream.cwd, 'master');
		}, error)
		.then(function() {
			var deferred = Q.defer(),
			deferedCallback = function(err) {
				if (err) {
					return deferred.reject(err);
				}

				return deferred.resolve();
			};
			r = release(origin, deferedCallback, false);

			return deferred.promise;
		}, error)
		.then(function() {
			return origin.exec('branch');
		}, error).then(function(stdout) {
			localBranchName = stdout.match(currentBranchRegexp)[1];
			callback();
		}, error);
	});

	it('Creates a commit for the new version', function(done) {
		callback = done;

		origin.exec('log', localBranchName + '~2..' + localBranchName +'~1')
		.then(function(stdout) {
			expect(stdout).to.contain('Updated files for the v4.0.1 maintenance release');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Updates the version number in package.json and bower.json for the release', function(done) {
		callback = done;

		origin.exec('log', localBranchName + '~2..' + localBranchName +'~1')
		.then(function(stdout) {
			var commitNumber = stdout.match(/commit ([^\n]*)/)[1];

			return origin.exec('checkout', commitNumber);
		}, error)
		.then(function() {
			var pkg = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/package.json'))),
				bower = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/bower.json')));

			expect(pkg.version).to.be('4.0.1');
			expect(bower.version).to.be('4.0.1');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Updates the WET core dependency for the release', function() {
		var bower = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/bower.json')));
		expect(bower.devDependencies['wet-boew']).to.contain('#4.0.1');
	});

	it('Creates a tag for the release', function(done) {
		callback = done;

		origin.exec('tag', '-l', '-n')
		.then(function(stdout) {
			expect(stdout).to.contain('v4.0.1');
			expect(stdout).to.contain('Source files for the v4.0.1 maintenance release');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Creates a commit for the new development version', function(done) {
		callback = done;

		origin.exec('log', localBranchName + '~1..' + localBranchName)
		.then(function(stdout) {
			expect(stdout).to.contain('Updated the build version to v4.0.2-development');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Updates the version number in package.json and bower.json for the development version', function(done) {
		callback = done;

		origin.exec('log', localBranchName + '~1..' + localBranchName)
		.then(function(stdout) {
			var commitNumber = stdout.match(/commit ([^\n]*)/)[1];

			return origin.exec('checkout', commitNumber);
		}, error)
		.then(function() {
			var pkg = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/package.json'))),
				bower = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/bower.json')));

			expect(pkg.version).to.be('4.0.2-development');
			expect(bower.version).to.be('4.0.2-development');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Updates the WET core dependency for the development version', function() {
		var bower = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/bower.json')));
		expect(bower.devDependencies['wet-boew']).to.contain('#master');
	});

	it('Pushes the release branch upstream', function(done) {
		callback = done;

		upstream.exec('log', 'master')
		.then(function(stdout) {
			expect(stdout).to.contain('Updated the build version to v4.0.2-development');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Pushes the tag upstream', function(done) {
		callback = done;

		upstream.exec('tag', '-l', '-n')
		.then(function(stdout) {
			expect(stdout).to.contain('v4.0.1');
			expect(stdout).to.contain('Source files for the v4.0.1 maintenance release');
		}, error)
		.then(function(){
			callback();
		}, error);
	});

	it('Cleans up after the release', function(done) {
		callback = done;

		r.cleanup(function() {
			return origin.exec('branch')
			.then(function(stdout) {
				var branch = stdout.match(currentBranchRegexp)[1];

				expect(branch).to.be('master');
				expect(stdout).to.not.contain(localBranchName);
			}, error)
			.then(function(){
				callback();
			}, error);
		});
	});
});
