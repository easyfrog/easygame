// 包装函数
module.exports = function(grunt) {
 
	// 任务配置,所有插件的配置信息
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		// concat
		concat: {
			domop:{
				src:[
					 "js/threejs/Detector.js",
					 "js/threejs/three.min.js",
					 "js/loaders/sea3d.min.js",
					 "js/controls/OrbitControls.js",
					 "js/webShow/*.js",
					 "**/com_*.js",
					 "scripts/main.js"
				],
				dest:"build/build.js"
			}
		},
		// uglify插件的配置信息
		uglify: {
			build: {
				src: 'build/build.js',
				dest: 'build/build.min.js'
			}
		}
	});
 
	// 告诉grunt我们将使用插件
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// 告诉grunt当我们在终端中输入grunt时需要做些什么
	grunt.registerTask('default', ['concat', 'uglify']);
};