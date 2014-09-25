var fs = require('fs');
var expect = require('expect.js');
var ncp = require('ncp').ncp;
var rimraf = require('rimraf');
var git = require('../lib/helpers/git');
var release = require('../lib/release');

describe('Themes Release Process', function () {
	var testFolder = './test',
		initialFolder = testFolder + '/initial',
		originFolder = testFolder + '/origin',
		upstreamFolder = testFolder + '/upstream',
		originPath = originFolder + '/theme',
		origin = new git(originPath),
		upstreamPath = upstreamFolder + '/theme',
		upstream = new git(upstreamPath);

	before(function( done ) {
		var error = function(error){
			done(error);
		};

		ncp(initialFolder, originFolder, function(err) {
			if (err) {
				return console.error(err);
			}

			try {
				fs.mkdirSync(upstreamFolder);
			} catch (err) {
			} finally {
				fs.mkdirSync(upstreamPath);
			}

			upstream.create(true)
			.then(function(){
				return origin.create();
			}, error)
			.then(function(){
				return origin.exec('push', upstream.cwd, 'master');
			}, error)
			.then(function(){
				release(origin, done);
			}, error);
		});
	});

	after(function(){
		rimraf.sync(originFolder);
		rimraf.sync(upstreamFolder);
	});

	it('runs', function() {
		expect(true).to.be(true);
	});
});
