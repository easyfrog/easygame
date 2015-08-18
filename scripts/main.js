
if (!Detector.webgl) {
	alert('not support webgl');
}

var container = document.getElementById('container');
console.log(container);
var game = new Game(container, {
	rendererConfig: {
		antialias: true,
		alpha: true
	},
	debug: true
});

// regisite components
game.registerComponents(['com_Test2', 'com_Kao']);

game.load('resources/model/sea3d/test.sea', 'inno');

game.addEventListener(Game.PROGRESS, function(p) {
	console.log((p * 100).toFixed(1) + '%');
});

game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);

game.addEventListener(Game.PICKED, function(obj) {
	if (obj.name == 'zhuban') {
		console.log('you pressed zhuban object');
		alone(game.sh.root, 'zhuban');
	}
});

game.addEventListener(Game.KEYDOWN, function(key) {
	if (key == 32) {				// space
		if (tmpAnim) {
			tmpAnim.play('box_light_anim');
		}
	}
});

var tmpAnim;
function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);

	game.letTextureEmissive(1, 1); 

	var mesh = game.sea.getMesh('Box001');
	var mesh2 = mesh.clone();
	mesh2.name = 'b2';
	mesh2.position.x = 100;
	game.scene.add(mesh2);

	mesh.addComponent('com_Kao');
	mesh2.addComponent('com_Test2');

	var sphereGeo = new THREE.SphereGeometry(30);
	var sphereMat = new THREE.MeshLambertMaterial({color: 0xEF4343});
	var sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
	game.scene2 = new THREE.Scene();
	game.scene2.add(sphereMesh);
	var light = new THREE.HemisphereLight(0xEF4343, 0xEF4343, 1.7);
	game.scene2.add(light);

	game.cameraController.maxPolarAngle = Math.PI / 2;

	var camera2 = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
	camera2.target = new THREE.Vector3(0, 0, 0);
	camera2.position.z = 400;
	camera2.aspect = game.camera.aspect;
	camera2.updateProjectionMatrix();

	game.renderer.autoClear = false;
	game.addEventListener(Game.POSTUPDATE, function() {
		var val = Math.sin(game.getTime()) + 1;

		sphereMesh.scale.set(val, val, val);

		game.renderer.clear(false, true, false);
		game.renderer.render(game.scene2, camera2);
	});

	// game.renderer.setViewport();

	var dummy = new THREE.Object3D();
	dummy.position.set(100,100,100);
	dummy.rotation.set(0, Math.PI / 2, 0);

	utils.transfromTo(mesh, dummy, 1, ztc.Tween.easeOutQuad);

	/*
	// 鹅的变形动画
	var goose = game.sea.getMesh('goose1');
	utils.morphObject(game, goose, {duration: 2000});

	// 湖水的变形动画
	var lake = game.sea.getMesh('lake');
	utils.morphObject(game, lake, {duration: 2000});

	var ground = game.sea.getMesh('ground');

	var nuanLight = game.sea.getLight('nuanLight');
	var lengLight = game.sea.getLight('lengLight');
	nuanLight.intensity = .7;
	lengLight.intensity = .7;

	// grow up animation
	// ground.scale.setY(0.04);
	ztc.Tween.isDom = false;

	var mainCam = game.sea.getCamera('mainCam');

	utils.sameTransform(game.camera, mainCam);

	// game.addEventListener(Game.UPDATE, function() {
	// 	nuanLight.intensity = Math.abs(Math.sin(game.getTime() + 0.2));
	// 	lengLight.intensity = Math.abs(Math.sin(game.getTime() + 0.2));
	// });
	
	// 整体的基本动画
	game.playGeneralAnimation('normal');
	//*/
}