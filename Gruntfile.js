module.exports = function (grunt) {
    var sourceFiles = [
        "src/models/column.js",
        "src/models/row.js",
        "src/collections/columnCollection.js",
        "src/collections/rowCollection.js",
        "src/views/aTable.js",
        "src/util.js"];

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
                banner : '/*! <%= pkg.name %> v<%= pkg.version %>\n'
                    + ' * Date: <%= grunt.template.today("yyyy-mm-dd") %>\n'
                    + ' * Author: <%= pkg.author %> \n */\n\n'
            },
            dist : {
                src : sourceFiles,
                dest : 'dist/atable.js'
            }
        },
        uglify : {
            options : {
                banner : '/*! <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build : {
                files : {
                    'dist/atable.min.js' : 'dist/atable.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};