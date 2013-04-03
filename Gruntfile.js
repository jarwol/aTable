module.exports = function (grunt) {
    var sourceFiles = [
        "src/models/column.js",
        "src/models/row.js",
        "src/collections/columnCollection.js",
        "src/collections/rowCollection.js",
        "src/views/aTable.js"];

    var banner = '/*!\n'
        + ' * <%= pkg.name %> v<%= pkg.version %>\n'
        + ' * Copyright (c) 2012-2013 Jared Wolinsky\n'
        + ' * Licensed under the MIT License - http://opensource.org/licenses/MIT\n */\n';

    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        jshint : {
            all : ['src/**/*.js', '!src/lib/*', 'test/*.js', '!test/qunit.js'],
            options : {
                laxbreak : true,
                proto : true
            }
        },
        qunit : {
            all : ['test/test.html']
        },
        concat : {
            options : {
                separator : '\n\n',
                banner : banner + '\n'
            },
            dist : {
                src : sourceFiles,
                dest : 'dist/atable.js'
            }
        },
        uglify : {
            options : {
                banner : banner
            },
            build : {
                files : {
                    'dist/atable.min.js' : 'dist/atable.js'
                }
            }
        },
        jsdoc : {
            dist : {
                src : ['src/**/*.js', '!src/lib/*'],
                options : {
                    destination : 'doc'
                }
            }
        }
    })
    ;

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-jsdoc');

// Default task(s).
    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

}
;