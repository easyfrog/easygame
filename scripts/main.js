
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

var jbd, jbt, tong, tea;
var jbd_visible = false, jbt_visible = false;

// regisite components
game.registerComponents([]);

// load scene
game.load('resources/model/sea3d/bar.sea', 'inno');

game.addEventListener(Game.PROGRESS, function(p) {
	console.log((p * 100).toFixed(1) + '%');
});

game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);

function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);

	// 材质自发光
	game.letTextureEmissive(1, 1);

	var mainCamera = game.sea.getCamera('mainCamera');
	game.camera.position.copy(mainCamera.position);
	game.camera.rotation.copy(mainCamera.rotation);

	jbd = game.sea.getMesh('jbd');
	jbt = game.sea.getMesh('jbt');
	jbd.visible = jbt.visible = false;

	tong = game.sea.getMesh('tong');
	tea = game.sea.getMesh('tea');
	chouti = game.sea.getMesh('chouti');

	chouti.animation.onComplete = function(anim) {
		if (!chouti.picked) {
			delete tong.picked;
			delete tea.picked;
			jbt_visible = jbd_visible = false;
			tong.animation.timeScale = tea.animation.timeScale = 1;
			utils.setAnimationTime(tong.animation, 'open', 'end');
			utils.setAnimationTime(tea.animation, 'open', 'end');
		}
	}
}

// 点击物体
game.addEventListener(Game.PICKED, function(obj) {
	// if (game.currentPicked) {
		// var obj = game.currentPicked;
		if (['chouti', 'tong', 'tea'].indexOf(obj.name) > -1) {
			if ('picked' in obj) {
				obj.animation.timeScale = -obj.animation.timeScale;
				obj.picked = !obj.picked
			} else {
				obj.picked = true;
			}

			if (obj.name == 'tong') {
				jbd_visible = obj.picked;
			}

			if (obj.name == 'tea') {
				jbt_visible = obj.picked
			}

			if (obj.name == 'chouti') {
				if (obj.picked) {
					jbd.visible = jbd_visible;
					jbt.visible = jbt_visible;
				}
			}

			obj.animation.play('open');
		}
	// }
});
