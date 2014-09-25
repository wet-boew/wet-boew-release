var fs = require('fs');
var ncp = require('ncp').ncp;
var rimraf = require('rimraf');
var paths = require('./paths');

require('./core');
require('./theme');

before(function(done) {
	ncp(paths.initialFolder, paths.originFolder, function(err) {
		if (err) {
			done(err);
		}

		try {
			fs.mkdirSync(paths.upstreamFolder);
		} catch (err) {
		} finally {
			done();
		}
	});
});

after(function() {
	rimraf.sync(paths.originFolder);
	rimraf.sync(paths.upstreamFolder);
});
