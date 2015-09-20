// 包装函数
module.exports = function(grunt) {

	// 载入每个不同的Project所对应的不同的构建文件
	grunt.file.recurse('./projects', function(abspath, rootdir, subdir, filename) {
		if (filename.indexOf('_grunt') > -1) {
			require('./' + abspath)(grunt);
		}
	});

	// 必要的类库文件
	grunt.config.merge({
		copy: {
			libs:{
				files:[
					{src:"js/threejs/three.min.js", dest: "<%= grunt.projectFolder %>/libs/th.js"},
					{src:"js/loaders/sea3d.min.js", dest: "<%= grunt.projectFolder %>/libs/se.js"},
				]
			}
		},
		uglify: {
			allEngine: {	// easygame engine all in one
				src:[
					"js/threejs/Detector.js", 
					"js/threejs/three.min.js",
					"js/loaders/sea3d.min.js",
					"js/controls/OrbitControls.js",
					"js/webShow/*.js",
					"js/tools/edgeToolsBase.js",
				],
				dest:'build/easygame.min.js'
			}
		}
	});

	// 告诉grunt我们将使用插件
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('withlibs', 'copy libs files first', function() {
		var taskList;
		if (grunt.needLibs == true || grunt.needLibs == undefined) {
			taskList = ['copy:libs'].concat(grunt.currentTask);
		} else {
			taskList = grunt.currentTask;
		}
		
		grunt.task.run(taskList);
	});

	/**
	 * create project
	 * example: grunt create:project:E\:projects/xxx/
	 */
	grunt.registerTask('create', 'create a easygame project', function(name, path) {
		var project = grunt.project = name;
		var projectFolder = grunt.projectFolder = path;

		var jsfile = 'projects/' + project + '/' + project + '.js';
		var gruntfile = 'projects/' + project + '/' + project + '_grunt.js';

		if (!grunt.file.exists(jsfile)) {
			grunt.file.copy('templates/project.js', jsfile, {
				process: function(contents) {
					return grunt.template.process(contents);
				}
			});
		}
		
		if (!grunt.file.exists(gruntfile)) {
			grunt.file.copy('templates/project_grunt.js', gruntfile, {
				process: function(contents) {
					return grunt.template.process(contents);
				}
			});
		}

		grunt.file.mkdir(path + '/models');
		grunt.file.copy('Gruntfile.js', 'Gruntfile.js'); // update
		grunt.log.writeln(project + ' project create complete!');
	});

};