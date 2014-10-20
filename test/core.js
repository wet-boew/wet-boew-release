var path = require('path');
var fs = require('fs');
var expect = require('expect.js');
var Q = require('q');
var Git = require('node-git-simple');
var release = require('../lib/release');
var paths = require('./paths');

describe('Core Release Process', function () {
	var originPath = paths.originFolder + '/core',
		upstreamPath = paths.upstreamFolder + '/core',
		currentBranchRegexp = /\*\s*([^\n]*)/,
		upstream, origin, localBranchName, callback, r;

	var error = function(error) {
		if (callback) {
			callback(error);
		}
	};

	before(function(done) {
		callback = done;

		fs.mkdirSync(upstreamPath);

		Git.create(upstreamPath, true)
		.then(function(repo) {
			upstream = repo;
			return Git.create(originPath);
		}, error)
		.then(function(repo) {
			origin = repo;
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
		}, error).then(function(repo) {
			localBranchName = repo.lastCommand.stdout.match(currentBranchRegexp)[1];
			callback();
		}, error);
	});

	it('Creates a commit for the new version', function(done) {
		callback = done;

		origin.exec('log', localBranchName + '~2..' + localBranchName +'~1')
		.then(function(repo) {
			expect(repo.lastCommand.stdout).to.contain('Updated files for the v4.0.1 maintenance release');

			callback();
		}, error)
		.then(null, error);
	});

	it('Updates the version number in package.json and bower.json for the release', function(done) {
		callback = done;

		origin.exec('rev-parse', localBranchName + '~1')
		.then(function(repo) {console.log(repo.lastCommand.stdout);
			var commitNumber = repo.lastCommand.stdout.replace('\n', '');

			return origin.exec('checkout', commitNumber);
		}, error)
		.then(function() {
			var pkg = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/package.json'))),
				bower = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/bower.json')));

			expect(pkg.version).to.be('4.0.1');
			expect(bower.version).to.be('4.0.1');

			callback();
		}, error)
		.then(null, error);
	});

	it('Creates a tag for the release', function(done) {
		callback = done;

		origin.exec('tag', '-l', '-n')
		.then(function(repo) {
			expect(repo.lastCommand.stdout).to.contain('v4.0.1');
			expect(repo.lastCommand.stdout).to.contain('Source files for the v4.0.1 maintenance release');

			callback();
		}, error)
		.then(null, error);
	});

	it('Creates a commit for the new development version', function(done) {
		callback = done;

		origin.exec('log', localBranchName + '~1..' + localBranchName)
		.then(function(repo) {
			expect(repo.lastCommand.stdout).to.contain('Updated the build version to v4.0.2-development');

			callback();
		}, error)
		.then(null, error);
	});

	it('Updates the version number in package.json and bower.json for the development version', function(done) {
		callback = done;

		origin.exec('rev-parse', localBranchName)
		.then(function(repo) {
			var commitNumber = repo.lastCommand.stdout.replace('\n', '');

			return origin.exec('checkout', commitNumber);
		}, error)
		.then(function() {
			var pkg = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/package.json'))),
				bower = JSON.parse(fs.readFileSync(path.join(origin.cwd + '/bower.json')));

			expect(pkg.version).to.be('4.0.2-development');
			expect(bower.version).to.be('4.0.2-development');

			callback();
		}, error)
		.then(null, error);
	});

	it('Pushes the release branch upstream', function(done) {
		callback = done;

		upstream.exec('log', 'master')
		.then(function(repo) {
			expect(repo.lastCommand.stdout).to.contain('Updated the build version to v4.0.2-development');

			callback();
		}, error)
		.then(null, error);
	});

	it('Pushes the tag upstream', function(done) {
		callback = done;

		upstream.exec('tag', '-l', '-n')
		.then(function(repo) {
			expect(repo.lastCommand.stdout).to.contain('v4.0.1');
			expect(repo.lastCommand.stdout).to.contain('Source files for the v4.0.1 maintenance release');

			callback();
		}, error)
		.then(null, error);
	});

	it('Cleans up after the release', function(done) {
		callback = done;

		r.cleanup(function() {
			return origin.exec('branch')
			.then(function(repo) {
				var branch = repo.lastCommand.stdout.match(currentBranchRegexp)[1];

				expect(branch).to.be('master');
				expect(repo.lastCommand.stdout).to.not.contain(localBranchName);

				callback();
			}, error)
			.then(null, error);
		});
	});
});
