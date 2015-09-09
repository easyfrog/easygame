
(function() {
	var scripts = [
		"js/threejs/Detector.js",
		"js/threejs/three.min.js",
		"js/loaders/sea3d.min.js",
		"js/webShow/threeExtend.js",
		"js/controls/OrbitControls.js",
		"js/webShow/SceneHandler.js",
		"js/webShow/Tween.js",
		"js/webShow/game.js",
		"js/webShow/utils.js",
		// 'scripts/lenovop1.js'
		'scripts/main.js'
	];

	var build = 'build/build.min.js';

	if (window.location.protocol == 'http:') {
		document.write("<script src='" + build + "?v=" + Math.random() + "'></script>");  
	} else {
		for (var i = 0; i < scripts.length; i++) {
			document.write("<script src='" + scripts[i] + "?v=" + Math.random() + "'></script>");
		};
	}
}());