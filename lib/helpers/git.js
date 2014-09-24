var cp = require('child_process');
var path = require('path');
var fs = require('fs');
var Q = require('q');

var exec = function (cwd, args) {
    if (!fs.existsSync(cwd)) {
        throw new Error('Path \'' + cwd + '\' not found');
    }

    var deferred = Q.defer(),
        process;

    process = cp.spawn('git', args, {cwd: cwd});

    process.stdout.on('data', function (data) {
        data = data.toString();console.log(data);
        deferred.notify(data);
    });
    process.stderr.on('data', function (data) {
        data = data.toString();console.log(data);
        deferred.notify(data);
    });

    process.on('close', function (code) {
          if (code) {
            return deferred.reject(new Error('Failed to execute git "' + args.join(' ') + '", exit code of #' + code, 'ECMDERR'));
        }

        return deferred.resolve();
    });
    return deferred.promise;
};

module.exports = function(cwd) {
    cwd = cwd ? path.resolve(cwd) : undefined;

    return {
        create: function(){

            return exec(cwd, ['init'])
                .then(function() {
                    return exec(cwd, ['add', '.']);
                })
                .then(function() {
                    return exec(cwd, ['commit', '-m', '"Initial commit"']);
                });
        }
    };
};

module.exports.exec = exec;
