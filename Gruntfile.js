'use strict';
module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [
                'Gruntfile.js',
                'bin/*',
                'lib/**/*.js',
                'test/**/*.js',
            ]
        },
        simplemocha: {
            options: {
                reporter: 'spec',
                timeout: '5000'
            },
            full: {
                src: ['test/test.js']
            },
            short: {
                options: {
                    reporter: 'dot'
                },
                src: ['test/test.js']
            }
        }
    });

    grunt.registerTask('test', ['jshint','simplemocha:full']);
    grunt.registerTask('travis', ['test']);
    grunt.registerTask('default', 'test');
};
