module.exports = function (grunt) {
    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),
      qunit: {
        "jquery.formset": ["tests/**/*.html"],
        options: {
          puppeteer: {
            headless: 'new',
          },
        },
      },
      uglify: {
        options: {
          banner:
            '/*! <%= pkg.name %> (v<%= pkg.version %>) <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        },
        build: {
          src: "src/<%= pkg.name %>.js",
          dest: "build/<%= pkg.name %>.min.js",
        },
      },
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    
    grunt.registerTask("build", ["qunit", "uglify"]);
};