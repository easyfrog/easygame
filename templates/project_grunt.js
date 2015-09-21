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
							"projects/<%= grunt.project %>/com_*.js",	// 打包项目组件
							"projects/<%= grunt.project %>/<%= grunt.project %>.js",
						],
						dest: '<%= grunt.projectFolder %>/main.js'
					}
				]
			}
		}
	});

	(function(project, path) {
		grunt.registerTask(project, '', function() {
			// 设置项目目录位置
			grunt.projectFolder = path;
			// 设置grunt项目名
			grunt.project = project;
			// 设置当前任务(可以为单任务或数组)
			grunt.currentTask = 'uglify:' + project;
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