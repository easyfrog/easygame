
if (!Detector.webgl) {
	alert('not support webgl');
}

var container = document.getElementById('container');
var game = new Game(container, {
	rendererConfig: {
		antialias: true,
		alpha: true
	},
	debug: true
});

var glo = glo || {};

var jbd, jbt, tong, tea;
var jbd_visible = false, jbt_visible = false;

// regisite components
game.registerComponents(['com_PointLockController']);
game.registerComponents(['com_Pickable'], 'scripts/');

// load scene
game.load('resources/model/sea3d/table.tjs.sea', 'inno');

game.addEventListener(Game.PROGRESS, function(p) {
	console.log((p * 100).toFixed(1) + '%');
});

game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);

function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);

	// 材质自发光
	game.letTextureEmissive(.5, .5);

	var mainCamera = game.sea.getCamera('mainCamera');
	game.camera.position.copy(mainCamera.position);
	game.camera.rotation.copy(mainCamera.rotation);

	game.camera.addComponent('com_PointLockController');

	jbd = game.sea.getMesh('jbd');
	jbt = game.sea.getMesh('jbt');

	tong = game.sea.getMesh('tong');
	tea = game.sea.getMesh('tea');
	chouti = game.sea.getMesh('chouti');

	tong.addComponent('com_Pickable');
	tea.addComponent('com_Pickable');
	chouti.addComponent('com_Pickable');
}
