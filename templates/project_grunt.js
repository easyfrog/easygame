module.exports = function(grunt) {

	grunt.config.merge({
		// uglify插件的配置信息
		uglify: {
			<%= grunt.project %>: {
				files: [ 
					{
						src: [
							 "js/controls/OrbitControls.js",
							 "js/webShow/*.js",
						],
						dest: '<%= grunt.projectFolder %>/libs/eg.js'
					}, {
						src: [
							"js/tools/edgeToolsBase.js",
							// "js/coms/com_*.js",						// 打包easygame默认组件
							// "projects/<%= grunt.project %>/com_*.js",	// 打包项目组件 *instead with browserify*
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
		grunt.registerTask(project, '', function() {
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

			// 先执行将libs文件Copy到工程目录libs/下
			grunt.task.run('withlibs');
		});
	})(
		'<%= grunt.project %>',				// project name
		'<%= grunt.projectFolder %>'		// project path
	);

};