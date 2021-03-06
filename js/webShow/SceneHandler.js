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

    s.root = new THREE.SEA3D();
    // s.root.addClass(SEA3D.VertexAnimation);
    // s.root.invertZ = true;
    // s.root.invertCamera = true;
    s.root.matrixAutoUpdate = true;
    s.root.parser = THREE.SEA3D.AUTO;

    s.container = new THREE.Object3D();
    s.container.name = 'rootContainer';
    s.scene.add(s.container);
    s.bounding = undefined;
    s.onComplete = undefined;
    s.onProgress = undefined;
    s.castShadow = s.receiveShadow = true;
    s.currentGroup = null;
    s.root.onComplete = function() {s._onComplete();};
    s.root.onProgress = function(args) {s._onProgress(args);};
};

SceneHandler.prototype._onComplete = function() {
    var s = this;
    var len = s.root.meshes ? s.root.meshes.length : 0;
    // get bounding
    s.bounding = (new THREE.Box3()).setFromObject(s.container);
    for (var i = 0; i < len; i++) {
        s.root.meshes[i].castShadow     = s.castShadow;
        s.root.meshes[i].receiveShadow  = s.receiveShadow;

        // initialize works
        
    }
    root = s.root;
    s.container.add(s.root.container);
    
    // stop all animations
    SEA3D.AnimationHandler.stop();

    // console.log('s.currentGroup: ' + s.currentGroup);

    if (s.onComplete) s.onComplete( s.currentGroup );
    
    // 如果后面还有载入任务
    if (loadSequence.length > 0) {
        var next = loadSequence.shift();
        s._load(next.fileName, next.groupName);
    } else {
        isLoading = false;
    }
};

SceneHandler.prototype._onProgress = function(args) {
    var s = this;
    if (s.onProgress) s.onProgress(args);
};

var loadSequence = [];
var isLoading = false;
SceneHandler.groupIndex = 0;
SceneHandler.prototype.load = function( fileName, groupName ) {
    var s = this;

    // 加入载入队列
    loadSequence.push({fileName: fileName, groupName: groupName});

    // 如果当前没有下载
    if (!isLoading) {
        isLoading = true;
        // 取出队列中的第一个
        var work = loadSequence.shift();
        s._load(work.fileName, work.groupName);
    }
};

SceneHandler.prototype._load = function(fileName, groupName) {
    var s = this;
    groupName = groupName || SceneHandler.groupIndex + '';
    SceneHandler.groupIndex ++;

    // console.log('s.currentGroup: ' + s.currentGroup);

    if (fileName == undefined) {
        fileName = s.fileName;
    } else {
        s.fileName = fileName;
    }

    // 检测是否已经存在这个组, 如果存在就继续存入这个组中
    var ctn = s.container.getObjectByName(groupName);
    if (!ctn) {
        ctn = new THREE.Group();
        ctn.name = groupName;
    }

    s.currentGroup = ctn;

    s.root.container = ctn;

    s.root.load(fileName);
}

SceneHandler.prototype.update = function () {
    this.deltaTime = this.clock.getDelta();
    if (SEA3D.AnimationHandler != undefined) {
        THREE.SEA3D.AnimationHandler.update(this.deltaTime);
        if (THREE.AnimationHandler) {
            THREE.AnimationHandler.update(this.deltaTime);
        }
    }
    // var anims = SEA3D.AnimationHandler.animations;
    // for (var i = 0; i < anims.length; i++) {
    //     var anim = anims[i];
    //     if (!('autoUpdate' in anim) || anim.autoUpdate == true) {
    //         anim.update(this.deltaTime);
    //     }
    // };
};

SceneHandler.prototype.play = function(name,speed,repeat, callback) {
    var s = this,anim;
    if (repeat == undefined) repeat = false;

    name = name || 'normal';
    speed = speed || 1;
    var completeAdded = false;

    // meshes && dummys
    var objs = s.root.meshes;
    if (s.root.dummys) {
        objs.concat(s.root.dummys);
    }

    for (var i = 0;i < objs.length; i ++ ) {
        anim = objs[i].animation || objs[i].animator;

        var have = false;
        if (anim) {
            if (anim.animationSet) {
                have = anim.animationSet.animations[name];
            } else {
                have = anim.animations[name];
            }
        }
        
        if (have && !anim.onComplete && callback && !completeAdded) {
            completeAdded = true;
            var fun = (function(anim, callback) {
                            var _a = anim;
                            var _c = callback;
                            return function() {
                                _a.onComplete = null;
                                if (_c) {
                                    _c();
                                }
                            };
                        })(anim, callback);
            if (anim.animationsData) {
                anim.animationsData[name] = fun;
            } else {
                anim.onComplete = fun;
            }
        }

        // if (anim && anim.animationSet.animations[name]) {
        if (have) {
            // repeat
            // for (var a in anim.animationSet.animations) {
            //     anim.animationSet.animations[a].repeat = repeat;
            // }
            if (anim.setTimeScale) {
                anim.setTimeScale(speed);
            } else {
                anim.timeScale = speed;
            }
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
