
var glo = window.glo || {};
var isAnimating = false;
var targetPos;

var stage, game;
// Edge Loaded 
AdobeEdge.bootstrapCallback(function(compId) {
    stage = AdobeEdge.getComposition(compId).getStage();

    // scale to fix screen
    t.scaleToFixScreen(stage.getSymbolElement());

    // yepnope async load libs
    yepnope({
		load:[
			'libs/th.js',
			'libs/se.js',
			'libs/eg.js'
		],
		complete:function() {
			init();
		}
    });
});

function init() {
	// create game instance
	game = new Game(glo.container, {
		rendererConfig: {
			antialias: true,
			alpha: true
		},
		debug: true
	});

	// set default camera controller
	game.setOrbitController();
	targetPos = new THREE.Vector3(0, 0, 0);

	// load scene
	game.load('models/<%= grunt.project %>.sea', 'inno');

	// loading
	game.addEventListener(Game.PROGRESS, function(p) {
		console.log((p.progress * 100).toFixed(1) + '%');
	});

	// load compete 
	game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);
}

function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);
	
	// scene load complete
	

}