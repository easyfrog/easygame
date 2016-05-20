// 包装函数
module.exports = function(grunt) {

	// 载入每个不同的Project所对应的不同的构建文件
	grunt.file.recurse('./projects', function(abspath, rootdir, subdir, filename) {
		if (abspath.indexOf('_closed') == -1 && filename.indexOf('_grunt') > -1) {
			require('./' + abspath)(grunt);
		}
	});

	// 必要的类库文件
	grunt.config.merge({
		copy: {
			libs:{
				files:[
					{src:"js/threejs/three.min.js", dest: "<%= grunt.projectFolder %>/libs/th.js"},
					{src:"js/loaders/sea3d.min.js", dest: "<%= grunt.projectFolder %>/libs/se.js"}
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
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('withlibs', 'copy libs files first', function() {
		var taskList;
		if (grunt.needLibs == true || grunt.needLibs == undefined) {
			// libs version
			if (grunt.needLibsVersion) {
				var _path = 'misc/versions/' + grunt.needLibsVersion;
				grunt.file.copy(_path + '/sea3d/sea3d.min.js', grunt.projectFolder + '/libs/se.js');
				grunt.file.copy(_path + '/threejs/three.min.js', grunt.projectFolder + '/libs/th.js');
				taskList = grunt.currentTask;
			} else {
				taskList = ['copy:libs'].concat(grunt.currentTask);
			}
		} else {
			taskList = grunt.currentTask;
		}

		grunt.task.run(taskList);
	});

	/**
	 * use to delete the template file
	 */
	grunt.registerTask('deletefile', 'delete a file', function(filename) {
		grunt.file.delete(filename);
	});

	/**
	 * create project
	 * example: grunt create:project:E\/:projects/xxx
	 */
	grunt.registerTask('create', 'create a easygame project', function(name, path) {
		var project = grunt.project = name;
		var projectFolder = grunt.projectFolder = path;

		var jsfile = 'projects/' + project + '/' + project + '.js';
		var gruntfile = 'projects/' + project + '/' + project + '_grunt.js';

		if (!grunt.file.exists('projects/')) {
			grunt.file.mkdir('projects/');
		}

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

	/**
	 * 关闭项目
	 * 使其不被ternjs检测到,避免js提示的杂乱
	 * example: grunt --no-color close:changhong:lenovop1
	 */
	grunt.registerTask('close', 'close a easygame project', function() {
		var closedPath = 'projects/_closed/';

		if (arguments.length > 0) {
			for (var i = 0; i < arguments.length; i++) {
				var arg = arguments[i];
				copyDir('projects/' + arg, closedPath + arg, function() {
					grunt.log.writeln('project "' + arg + '" closed completed.');
					grunt.file.delete('projects/' + arg, {force: true});
				});
			};			
		}
	});	

	/**
	 * 打开项目
	 * 使其可以被ternjs检测到.用于js代码提示
	 * example: grunt --no-color open:changhong:lenovop1
	 */
	grunt.registerTask('open', 'open a easygame project', function() {
		var openPath = 'projects/';

		if (arguments.length > 0) {
			for (var i = 0; i < arguments.length; i++) {
				var arg = arguments[i];
				copyDir('projects/_closed/' + arg, openPath + arg, function() {
					grunt.log.writeln('project "' + arg + '" closed completed.');
					grunt.file.delete('projects/_closed/' + arg, {force: true});
				});
			};			
		}
	});

	/**
	 * 复制整个文件夹
	 */
	function copyDir(src, dest, callback) {
		grunt.file.recurse(src, function(abspath, rootdir, subdir, filename) {
			subdir = subdir ? subdir : '';
			grunt.file.copy(abspath, dest + '/' + subdir + '/' + filename);
		});

		if (callback) {
			callback();
		}
	};

};