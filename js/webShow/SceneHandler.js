/**
 * sea3D 场景加载
 * 可以设置载入时的 onProgress(args) 方法,得到载入时度
 */
var root;

var SceneHandler = function( fileName, scene, standard ) {
    var s = this;

    s.fileName = fileName;
    s.scene = scene;
    s.clock = new THREE.Clock();
    s.deltaTime = 0;
    if (standard == undefined) standard = false;
    s.standard = standard;

    s.root = new THREE.SEA3D(standard);
    s.root.invertZ = !standard;
    s.root.invertCamera = standard;
    s.root.matrixAutoUpdate = true;
    s.root.parser = THREE.SEA3D.AUTO;

    s.container = new THREE.Object3D();
    s.container.name = 'rootContainer';
    s.scene.add(s.container);
    s.bounding = undefined;
    s.onComplete = undefined;
    s.onProgress = undefined;
    s.castShadow = s.receiveShadow = true;
    s.root.onComplete = function() {s._onComplete();};
    s.root.onProgress = function(args) {s._onProgress(args);};
};

SceneHandler.prototype._onComplete = function() {
    var s = this;
    var len = s.root.meshes.length;
    // get bounding
    s.bounding = (new THREE.Box3()).setFromObject(s.container);
    for (var i = 0; i < len; i++) {
        s.root.meshes[i].castShadow     = s.castShadow;
        s.root.meshes[i].receiveShadow  = s.receiveShadow;
    }
    root = s.root;
    s.container.add(s.root.container);
    
    // stop all animations
    SEA3D.AnimationHandler.stop();
    
    if (s.onComplete) s.onComplete();
};

SceneHandler.prototype._onProgress = function(args) {
    var s = this;
    if (s.onProgress) s.onProgress(args);
};


SceneHandler.groupIndex = 0;
SceneHandler.prototype.load = function( fileName, groupName ) {
    var s = this;

    groupName = groupName || SceneHandler.groupIndex + '';
    SceneHandler.groupIndex ++;

    if (fileName == undefined) {
        fileName = s.fileName;
    } else {
        s.fileName = fileName;
    }

    var ctn = new THREE.Object3D();
    ctn.name = groupName;
    s.root.container = ctn;

    s.root.load(fileName);
};

SceneHandler.prototype.update = function () {
    this.deltaTime = this.clock.getDelta();
    SEA3D.AnimationHandler.update(this.deltaTime);
};

SceneHandler.prototype.play = function(name,speed,repeat) {
    var s = this,anim;
    if (repeat == undefined) repeat = false;

    name = name || 'normal';
    speed = speed || 1;

    for (var i = 0;i < s.root.meshes.length; i ++ ) {
        anim = s.root.meshes[i].animation;

        if (anim) {
            // repeat
            // for (var a in anim.animationSet.animations) {
            //     anim.animationSet.animations[a].repeat = repeat;
            // }
            anim.timeScale = speed;
            // play
            anim.play(name);
        }
    }
};

SceneHandler.prototype.stopAll = function() {
    // reset global time
    SEA3D.AnimationHandler.setTime( 0 );

    // stop all active animations
    SEA3D.AnimationHandler.stop();

};

/**
 * [set time scale]
 */
SceneHandler.prototype.setTimeScale = function (timeScale) {
    for(var i in SEA3D.AnimationHandler.animations) {
        SEA3D.AnimationHandler.animations[i].timeScale = timeScale;
    }
};
