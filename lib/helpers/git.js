var cp = require('child_process');
var path = require('path');
var fs = require('fs');
var Q = require('q');


var errorLog = function(error) {
    throw error;
};

module.exports = function(cwd) {
    cwd = cwd ? path.resolve(cwd) : undefined;

    return {
        cwd: cwd,

        create: function(bare){
            var that = this;

            if (bare) {
                return that.exec('init', '--bare');
            } else {
               return that.exec('init')
                    .then(function() {
                        return that.exec('add', '.');
                    }, errorLog)
                    .then(function() {
                        return that.exec('commit', '-m', '"Initial commit"');
                    }, errorLog);
            }
        },

        exec: function () {
            if (!fs.existsSync(cwd)) {
                throw new Error('Path \'' + this.cwd + '\' not found');
            }

            var deferred = Q.defer(),
                args = Array.prototype.slice.call(arguments),
                stdout = '',
                stderr = '',
                process;

            process = cp.spawn('git', args, {cwd: this.cwd});

            process.stdout.on('data', function (data) {
                data = data.toString();
                stdout += data;
                deferred.notify(data);
            });
            process.stderr.on('data', function (data) {
                data = data.toString();
                stdout += data;
                deferred.notify(data);
            });

            process.on('close', function (code) {
                  if (code) {
                    return deferred.reject(new Error('Failed to execute git "' + args.join(' ') + '", exit code of #' + code, 'ECMDERR'));
                }

                return deferred.resolve(stdout, stderr);
            });
            return deferred.promise;
        }
    };
};
