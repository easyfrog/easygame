module.exports = function(grunt) {

	grunt.config.merge({
		// uglify插件的配置信息
		uglify: {
			<%= grunt.project %>: {
				files: [ 
					{
						src: [
							 "js/controls/OrbitControls_ztc.js",
							 "js/webShow/*.js",
						],
						dest: '<%= grunt.projectFolder %>/libs/eg.js'
					}, {
						src: [
							"js/tools/edgeToolsBase.js",
							"build/<%= grunt.project %>.browserify.js" // 合入模块后的 project.js
						],
						dest: '<%= grunt.projectFolder %>/main.js'
					}
				]
			}
		},

		// browserify
		browserify: {
			<%= grunt.project %>: {
				src: "projects/<%= grunt.project %>/<%= grunt.project %>.js",
				dest: "build/<%= grunt.project %>.browserify.js" 
			}
		}
	});

	(function(project, path) {
		grunt.registerTask(project, '', function( version ) {
			// 先判断项目是否存在或已关闭?
			if (!grunt.file.exists('projects/' + project)) {
				grunt.log.writeln('project "' + project + '" NOT EXISTS. OR is CLOSED! use grunt --no-color open:"' + project + '" first.' );
				return;
			}
			// 设置项目目录位置
			grunt.projectFolder = path;
			// 设置grunt项目名
			grunt.project = project;
			// 设置当前任务(可以为单任务或数组)
			grunt.currentTask = ['browserify:' + project, 
								'uglify:' + project,
								'deletefile:build/<%= grunt.project %>.browserify.js'];
			// 是否需要3D库文件
			grunt.needLibs = true;

			var targetVersion = '<%= grunt.targetVersion %>';
			if (targetVersion == '') {targetVersion = undefined;}

			// 库文件版本 r72 | r76
			grunt.needLibsVersion = version || targetVersion;

			// 先执行将libs文件Copy到工程目录libs/下
			grunt.task.run('withlibs');
		});
	})(
		'<%= grunt.project %>',				// project name
		'<%= grunt.projectFolder %>'		// project path
	);

};