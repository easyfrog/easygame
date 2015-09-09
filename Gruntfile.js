// 包装函数
module.exports = function(grunt) {

	// 每个不同的Project所对应的不同的构建文件
	require('./grunts/lenovop1_grunt.js')(grunt);
	require('./grunts/changhong_grunt.js')(grunt);

	// 必要的类库文件
	grunt.config.merge({
		concat: {
			libs:{
				files:[
					{src:"js/threejs/Detector.js", dest: "<%= grunt.projectFolder %>libs/Detector.js"},
					{src:"js/threejs/three.min.js", dest: "<%= grunt.projectFolder %>libs/three.min.js"},
					{src:"js/loaders/sea3d.min.js", dest: "<%= grunt.projectFolder %>libs/sea3d.min.js"},
					{src:"js/tools/edgeToolsBase.js", dest: "<%= grunt.projectFolder %>libs/edgeToolsBase.js"}
				]
			}
		}
	});

	// 告诉grunt我们将使用插件
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('withlibs', 'copy libs files first', function() {
		grunt.task.run(['concat:libs', grunt.currentTask]);
	});

};