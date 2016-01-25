
window.glo = window.glo || {};
var isAnimating = false;
var targetPos,
	status = 0;

// 项目名称
var _projectName = '<%= grunt.project %>';

// 是否能看3D内容
glo.nengkan = true;

var stage, game;
// Edge Loaded 
AdobeEdge.bootstrapCallback(function(compId) {
    stage = AdobeEdge.getComposition(compId).getStage();

    // scale to fix screen
    var innerWidth = windwo.innerWidth < 640 ? 640 : window.innerWidth;
    t.scaleToFixScreen(stage.getSymbolElement(), innerWidth);
    // 统计
    t.analyze(_projectName);

    /**
     * get platform and version
     * 		glo.pf.platform = 'Android' / 'iPhone' ...
     *   	glo.pf.version = 444 / 511 ...
     */
    glo.pf = t.getPlatform();

    // nengkan by platform & version
    //*
    if (glo.pf.isWX && glo.pf.platform == 'Android' && glo.pf.version < 600) {
    	glo.nengkan = false;
    }
    //*/
    
    // nengkan by support webgl
    /*
    if (!t.supportWebGL()) {
        glo.nengkan = false;  
    }   
    //*/

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
    // game.loadSeas(['models/<%= grunt.project %>.sea], 'inno', function(alldone, count, allCount) { });
	game.load('models/<%= grunt.project %>.sea', 'inno');

	// loading progress
	game.addEventListener(Game.PROGRESS, function(p) {
		console.log((p.progress * 100).toFixed(1) + '%');
		/*
		glo.progressText.html((p.progress * 100).toFixed(1) + '%');
		if (p.type == 'sea3d_download') {
			glo.progressStatus.html('下载中...');
		} else {
			glo.progressStatus.html('场景构建中...');
		}
		*/
	});

	// load compete 
	game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);
}

function onLoadComplete() {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);
	t.analyzeIncrease(_projectName, 'sandi');

    // 分析场景,通过Mesh或Material的名称标签做一些预处理
    require('../../js/coms/analyzeScene')(game);
	
	// scene load complete
	

}