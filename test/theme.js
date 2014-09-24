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
		ncp(initialFolder, originFolder, function(err) {
			if (err) {
				return console.error(err);
			}

			ncp(initialFolder, upstreamFolder, function(err) {
				if (err) {
					return console.error(err);
				}

				upstream.create()
				.then(function(){
					return origin.create();
				})
				.then(function(){
					release(originPath, done);
				});
			});
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
