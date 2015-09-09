
if (!Detector.webgl) {
	alert('not support webgl');
}

var stage, game;
var camPath;
var originTargetPos = new THREE.Vector3(0, 52, 0);
var isAniamting = false;
var isChaijie = false;

var mainCameraPos;

// Edge Loaded 
AdobeEdge.bootstrapCallback(function(compId) {
    stage = AdobeEdge.getComposition(compId).getStage();

    document.addEventListener('deviceready', onDeviceReady, false);

    // Create game 
	game = new Game(glo.container, {
		rendererConfig: {
			antialias: true,
			alpha: true
		},
		debug: false
	});

	// 第一次进入3D
	glo.firstIn = true;

	glo.sandi.inover = function() {
		if (glo.firstIn) {
			firstIn();
		} else {
			game.pause = false;
			cameraToOriginal(1);
			glo.sandi.play(0);
		}
	}

	// game.renderer.domElement.addEventListener('click', function() {
	// 	alert(game.container.offsetWidth + ' ' + game.container.offsetHeight + ' ' +
	// 		game.renderer.domElement.offsetWidth + ' ' + game.renderer.domElement.offsetHeight);
	// });

	/*
	// debug
	setTimeout(function() {
		glo.debug.getSymbolElement().show();
		console.log('asdfsdf');
	}, 1000);

	glo.debugText = glo.debug.$('text');

	glo.log = function(w, h) {
		var str = w + ' ' + h + ' ' + window.innerWidth + ' ' + window.innerHeight + ' ' + window.devicePixelRatio + 
				 ' ' + window.outerWidth + ' ' + window.outerHeight + ' ' + screen.width + ' ' + screen.height;
		glo.debugText.html(str);
	};

	glo.wadd = function() {
		var w = game.width + 5;
		game.setSize(w, game.height);
		glo.log(game.width, game.height);
	};

	glo.wsub = function() {
		var w = game.width - 5;
		game.setSize(w, game.height);
		glo.log(game.width, game.height);
	};

	glo.hadd = function() {
		var h = game.height + 5;
		game.setSize(game.width, h);
		glo.log(game.width, game.height);
	};

	glo.hsub = function() {
		var h = game.height - 5;
		game.setSize(game.width, h);
		glo.log(game.width, game.height);
	};
	//*/
	
	// var guole = true;
	// game.addEventListener(Game.POSTUPDATE, function() {
	// 	if (guole && window.platform.isWX && window.platform.platform == 'Android') {
	// 		guole = false;
	// 		var h = game.height - 5;
	// 		game.setSize(game.width, h);
	// 	}
	// });

	// var __k = true
	// glo.sandi.getSymbolElement().bind('click touchend', function() {
	// 	if ( window.platform.isWX && window.platform.platform == 'Android') {
	// 		var h = __k ? game.height - 2 : game.height + 2;
	// 		__k = !__k;
	// 		game.setSize(game.width, h);
	// 		game.setSize(game.width, game.height);
	// 	}
	// });

	// 进入3D界面
	glo.tosandi = function() {
	
		if (glo.firstIn) {
			// set game size
			var w ,h;
			if (glo.container.offsetWidth == 0) {
				w = window.innerWidth / t.stageScale;
				h = window.innerHeight / t.stageScale;
			} else {
				w = glo.container.offsetWidth;
				h = glo.container.offsetHeight;
			}

			/*
			if (window.platform.isWX && window.platform.platform == 'Android') {
				// w = viewportSize.getWidth();
				// h = viewportSize.getHeight();
				// game.setSize(w, h);
				// game.setSize(640, 1008);
				game.setSize(w, w);
				
				//glo.log(w, h);
			} else {
				game.setSize(w, h);
			}
			//*/

			game.renderer.domElement.style.width = '100%';
			game.renderer.domElement.style.width = '100%';

			game.setSize(window.innerWidth / t.stageScale, window.innerHeight / t.stageScale);

			if (glo.lastSym.name != 'homeCenter') {
				firstIn();
			}
		} else {
			if (glo.lastSym.name != 'homeCenter') {
				game.pause = false;
			}
			cameraToOriginal(1);
			isChaijie = false;
			
			if (glo.lastSym.name != 'homeCenter') {
				glo.sandi.play(0);
			}
		}
	}

	glo.tutorialClose = function() {
		game.pause = false;
		startGame();
	};

	// 离开3D界面
	glo.out3d = function() {
		utils.setAllAnimationTime(game, 'general', 0);
		game.pause = true;
		isAniamting = false;
	}

	// 拆解模式动画
	glo.chaijie = function() {
		if (isAniamting || isChaijie) {
			return;
		}
		// if (window.platform.isWX && window.platform.platform == 'Android') {
		// 	game.setSize(640, 1009);
		// }
		game.playGeneralAnimation(null, 1);
		isAniamting = true;
		isChaijie = true;

		// 相机归位
		utils.transformTo(game.camera, mainCameraPos);
	}

	// 自由模式动画
	glo.ziyou = function() {
		if (isAniamting || !isChaijie) {
			return;
		}
		// if (window.platform.isWX && window.platform.platform == 'Android') {
		// 	game.setSize(640, 1009);
		// }
		game.playGeneralAnimation(null, -1)
		isAniamting = true;
		isChaijie = false;

		// 相机归位
		utils.transformTo(game.camera, mainCameraPos);
	}

	// 浏览动画
	glo.camPathAnim = function() {
		if (isAniamting) {
			return;
		}
		// if (window.platform.isWX && window.platform.platform == 'Android') {
		// 	game.setSize(640, 1009);
		// }
		glo.sandi.stop(0);
		utils.setAllAnimationTime(game, 'general', 0);
		startGame();
		isChaijie = false;
	};

	glo.loaderAnimOver = function() {
		// load scene
		game.load('resources/model/sea3d/lenovop1.sea', 'inno');
	};

	game.addEventListener(Game.PROGRESS, function(p) {
		// console.log((p * 100).toFixed(1) + '%');
		glo.progressText.innerHTML = (p * 100).toFixed(1) + '%';
	});

	game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);
});

function onDeviceReady() {
	document.addEventListener('backbutton', function() {
		if (glo.currentSym.name != 'homeCenter') {
			glo.goBack();
		} else {
			if (glo.setting.getSymbolElement().css('display') == 'block') {
				glo.setting.getSymbolElement().hide();
			}
		}
	}, false);
}

function startGame() {
	// origin camera transform
	cameraToOriginal(0);

	// if (window.platform.isWX && window.platform.platform == 'Android') {
	// 	game.setSize(640, 1009);
	// }
	
	// 播放相机动画
	setTimeout(function() {
		camPath.animation.timeScale = 0.7;
		utils.followAnimation(game, game.camera, camPath, 'view', true, function() {
			// 相机路径动画完成
			isAniamting = false;
			glo.sandi.play(0);

			if (!mainCameraPos) {
				mainCameraPos = new THREE.Object3D();
				utils.sameTransform(mainCameraPos, game.camera);
			}
		});
	}, 1300);
	isAniamting = true;
	glo.firstIn = false;
}

function firstIn() {
	glo.tutorial.getSymbolElement().show();
}

function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);

	game.pause = true;

	// setTimeout(function() {
		glo.preloader.play('loaded');
	// }, 0);

	// set default camera controller
	game.setOrbitController();
	game.cameraController.zoomSpeed = 0.3;
	game.cameraController.target.copy(originTargetPos);
	game.cameraController.minDistance = 128;
	game.cameraController.maxDistance = 423;

	game.camera.fov = 55;

	// global light
	game.scene.add(new THREE.AmbientLight(0x666666));

	var light1 = game.sea.getLight('light1');
	var light2 = game.sea.getLight('light2');
	var light3 = game.sea.getLight('light3');

	light1.intensity = .59;
	light2.intensity = .44;
	light3.intensity = .5;
	
	camPath = game.sea.getCamera('camPath');

	var keTop = game.sea.getMesh('keTop');
	keTop.animation.onComplete = function() {
		console.log('general animation complete.');
		isAniamting = false;
	};

	var played = true;
	game.addEventListener(Game.KEYDOWN, function(e) {
		if (e.keyCode == 32) {
			game.playGeneralAnimation(null, (played ? 1 : -1))
			played = !played;
		}
		if (e.keyCode == 13) {
			cameraToOriginal();
		}
	});

	// ke material
	var keMat = game.sea.getMaterial('ke');
	keMat.metal = true;

	var textLow = game.sea.getMaterial('textLow');
	
	textLow.map.magFilter = THREE.NearestFilter;
	textLow.map.minFilter = THREE.NearestFilter;
	textLow.map.needsUpdate = true;

	// 
	// var tx = new THREE.Texture();
	// tx.magfilter
	//*/
}

function cameraToOriginal(percent) {
	if (camPath) {
		if (percent == undefined) {
			percent = 1;
		}
		utils.setAnimationTime(camPath.animation, 'view', percent);
		utils.sameTransform(game.camera, camPath, true);
		game.cameraController.target.copy(originTargetPos);
	}
}