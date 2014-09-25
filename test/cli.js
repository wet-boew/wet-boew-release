var cp = require('child_process');
var fs = require('fs');
var expect = require('expect.js');
var git = require('../lib/helpers/git');
var paths = require('./paths');

describe('CLI', function () {
    var originPath = paths.originFolder + '/core',
        origin = new git(originPath),
        upstreamPath = paths.upstreamFolder + '/core',
        upstream = new git(upstreamPath),
        currentBranchRegexp = /\*\s*([^\n]*)/,
        callback;

    var error = function(error) {
        if (callback) {
            callback(error);
        }
    };

    before(function(done) {
        callback = done;

        var remote = JSON.parse(fs.readFileSync(originPath + '/package.json')).repository.url;

        origin.exec('pull', remote, 'master')
        .then(function() {
            var release = cp.spawn('node', ['../../../bin/wet-boew-release'], {cwd: originPath});

            release.on('close', function (code) {
                if (code) {
                    return done(new Error('Failed to execute wet-boew-release, exit code of #' + code, 'ECMDERR'));
                }

                done();
            });
        }, error);
    });

    it ('Performs the update in the current directory and pushes upstream', function(done) {
        callback = done;

        upstream.exec('log')
        .then(function(stdout) {
            expect(stdout).to.contain('Updated the build version to v4.0.3-development');
            callback();
        }, error)
        .then(null, error);
    });

    it ('Cleans up after the release', function(done) {
        callback = done;

        origin.exec('branch')
        .then(function(stdout) {
            var branch = stdout.match(currentBranchRegexp)[1];

            expect(branch).to.be('master');

            callback();
        }, error)
        .then(null, error);
    });
});
