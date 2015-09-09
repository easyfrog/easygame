
var stage, game;

// Edge Loaded 
AdobeEdge.bootstrapCallback(function(compId) {
    stage = AdobeEdge.getComposition(compId).getStage();
    t.scaleToFixScreen(stage.getSymbolElement());

    init();
});

function init() {

	game = new Game(glo.container, {
		rendererConfig: {
			antialias: true,
			alpha: true
		},
		debug: true
	});

	// load scene
	game.load('resources/model/sea3d/changhong.sea', 'inno');

	game.addEventListener(Game.PROGRESS, function(p) {
		console.log((p * 100).toFixed(1) + '%');
	});

	game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);

}

function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);
	
	game.letTextureEmissive(1, 1);

	var mainCamera = game.sea.getCamera('mainCamera');
	utils.sameTransform(game.camera, mainCamera);

	game.setOrbitController();
}