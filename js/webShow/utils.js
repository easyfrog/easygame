/**
 * 工具类
 */
window.utils = window.utils || {};

/**
 * 将导出的Morph Target的点反转
 * @param  {[type]} geometry [description]
 * @return {[type]}          [description]
 */
utils.fixMorphTargets = function(geometry) {
	if (!geometry.morphTargets) {
		return;
	}

	var target, tmp;
	for (var i = 0; i < geometry.morphTargets.length; i++) {
		target = geometry.morphTargets[i]
		for (var j = 0; j < target.vertices.length; j+=3) {
			tmp = target.vertices[j + 1] ;
			target.vertices[j + 1] = target.vertices[j + 2]
			target.vertices[j + 2] = tmp;
		};
	};
};


/**
 * 变形物体动画
 * params: {duration: 1000, loop: false}
 */
utils.morphObject = function(mesh, params) {
    params = params || {};

	var mor = new THREE.MorphAnimation(mesh);
	mor.duration = params.duration || 1000;
	if (params.loop == false) {
		mor.loop = false;	
	}

	mor.play();

	Game.instance.animations.push(mor);
	return mor;

}

/**
 * Include script 
 */
utils.include = function(file, httpuse) {
	if (!httpuse && window.location.protocol == 'http:') {
		return;
	}
	document.write("<script src='" + file + "?v=" + Math.random() + "'></script>"); 
};

/**
 * 将 from 的位置,旋转,缩放设置为与 to 一至
 */
utils.sameTransform = function(from, to, nop, nor, nos) {
	var toap = to.getWorldPosition();
	var toaq = to.getWorldQuaternion();
	var toas = to.getWorldScale();

	if (!nop) {
		from.position.copy(toap);
	}
	if (!nor) {
		from.quaternion.copy(toaq);
		}
	if (!nos) {
		from.scale.copy(toas);
	}
};

/**
 * 将一个物体的位置与旋转属性渐变至另一个物体处
 */
utils.transformTo = function(from, to, time, cv, over, update) {
	if (!ztc.Tween) {
		console.warn('utils.transformTo: Do not have ztc.Tween!');
		return;
	};

	cv = cv || ztc.Tween.easeOutQuad;
	over = over || utils.transformToComplete;

	var qm = new THREE.Quaternion();
	var qa = from.quaternion.clone();
	var qb = to.quaternion;

	ztc.Tween.isDom = false;
    if (time == undefined) {time = 1};
    ztc.Tween.actionArrayProps([from.position], time, 
	   [{
	   		x:to.position.x,
	   		y:to.position.y,
	   		z:to.position.z		
	   }], cv, function() {
	   		// default transform to function
	   		if (utils.transformToComplete) {
	   			utils.transformToComplete();
	   		}
	   		if (over) {
	   			over();
	   		}
	   }, function(f) {
		   	THREE.Quaternion.slerp(qa, qb, qm, f);
		   	from.quaternion.set(qm.x, qm.y, qm.z, qm.w);
		   	if (update) {
		   		update(f);
		   	}
	});
};

/**
 * 简单的入场相机动画
 * params: camera(obj), target(v3), over(fn), distacneScale(float), offset(v3)
 */
utils.simpleCameraEntrance = function(params) {
	var game = Game.instance;
	var mainCam = params.camera;
	params.target = params.target || game.cameraController.target;
	var distanceScale = params.distanceScale || .3;
	var time = params.time || 1;

	utils.sameTransform(game.camera, mainCam);
	var distance = mainCam.position.distanceTo(params.target) * distanceScale;
	var offset = params.offset || new THREE.Vector3(0, distance, 0);
	var v = utils.cameraDirection(game.camera);
	var from = v.multiplyScalar(-distance).add(offset).add(game.camera.position);
	game.camera.position.set(from.x, from.y, from.z);
	utils.transformTo(game.camera, mainCam, time, null, function() {
	    if (params.over) {
	    	params.over();
	    }
	});
};


/**
 * 将3D世界的点,转化为屏幕坐标
 */
utils.toScreenPosition = function(vector, camera) {
	var _v = new THREE.Vector3(vector.x, vector.y, vector.z);
    var widthHalf = 0.5 * Game.instance.width * g.stageScale;
    var heightHalf = 0.5 * Game.instance.height * g.stageScale;

    _v.project(camera);

    _v.x = ( _v.x * widthHalf ) + widthHalf;
    _v.y = - ( _v.y * heightHalf ) + heightHalf;

    return new THREE.Vector2(_v.x, _v.y);
};

/**
 * 将屏幕坐标转化为世界坐标
 * @param  {vector2} mousePosition	mouse screen position
 * @param  {camera} camera        	the camera
 * @param  {num} z             		z distance
 * @return {vector3}               	get the world position
 */
utils.toWorldPosition = function(mousePosition, camera, z) {
	z = z || 1;
	var g = Game.instance;
	var mx = ((mousePosition.x - s.container.offsetLeft) / (g.width * g.stageScale)) * 2 - 1;
	var my = -((mousePosition.y - s.container.offsetTop) / (g.height * g.stageScale)) * 2 + 1;
	var vector = new THREE.Vector3(mx, my, z);
	return vector.unproject(camera);
};

/**
 * 设置动画到指定的时间位置(百分比)
 * example: time = 0 ~ 1
 */
utils.setAnimationTime = function(animator, stateName, percent) {
    var isNew = false;  // r72
    if (animator.animations) {
        isNew = true;   // r77
    }
	if ((!isNew && stateName in animator.states) || (isNew && stateName in animator.animations)) {
		try {
			if (percent < 0) {
				percent = 0;
			} else if (percent > 1) {
				percent = 1;
			}

            var clip = isNew ? animator.animations[stateName] : animator.states[stateName];
			var duration = isNew ? clip.duration : clip.node.duration;

            animator.pause(); // stop first
            if (isNew) {
                // get action in new clip system
                if (!animator.currentAnimationAction) {
                    animator.currentAnimationAction = animator.mixer.clipAction( clip ).setLoop( animator.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity ).reset();
                }
                var action = animator.currentAnimationAction;
                var bindings = animator.mixer._bindings;

                // calculate pose
                var interpolants = action._interpolants;
                var propertyMixers = action._propertyBindings;

                for ( var j = 0, m = interpolants.length; j !== m; ++ j ) {
                    interpolants[ j ].evaluate( percent * duration );
                    propertyMixers[ j ].accumulate( 0, 1 );
                }

                // also set to the action's time property
                action.time = percent;

                // update pose to mesh
                for ( var i = 0; i < bindings.length; ++ i ) {
                    bindings[ i ].apply( 0 );
                }
            } else {
    			animator.states[stateName].node.setTime(percent * duration);
    			animator.updateAnimation(stateName);
            }
		} catch (e) {
			console.log(e.message);	
		}
	} else {
		console.warn('Not have ' + stateName + ' state!');
	}
}

/**
 * 设置所有物体的指定动画的时间百分比
 */
utils.setAllAnimationTime = function(stateName, percent) {
	for (var i = 0; i < Game.instance.sea.meshes.length; i++) {
		var mesh = Game.instance.sea.meshes[i];
		if (mesh.animation) {
			utils.setAnimationTime(mesh.animation, stateName, percent);
		}
	};
};

/**
 * 让物体跟随一个物体的动画去改变位置与旋转
 */
utils.followAnimation = function(obj, target, stateName, complete) {
	(function(obj, target, stateName, complete) {
        var clip = target.animator ? target.animator.animationsData[stateName] : target.animation;
		var oldComplete = clip.onComplete;

		var _tmp = function() {
			utils.sameTransform(obj, target);
		}

		(target.animation || target.animator).play(stateName);
		Game.instance.addEventListener(Game.UPDATE, _tmp);

        function animComplete() {
                if (oldComplete) {
                    oldComplete();
                }
                clip.onComplete = oldComplete;

                Game.instance.removeEventListener(Game.UPDATE, _tmp);

                if (complete) {
                    complete();
                }
        }

        clip.onComplete = animComplete;

	})(obj, target, stateName, complete);
}

/**
 * 得到相机的方向向量
 */
utils.cameraDirection = function(camera) {
    camera = camera || Game.instance.camera;
	var vector = new THREE.Vector3(0, 0, -1);
   	vector.applyEuler(camera.rotation, camera.rotation.order);
   	return vector;
};

/**
 * 得到两个向量在平面上的点积(y值相等)
 */
utils.getVectorPlanDot = function(vec1, vec2) {
	var _vec = vec2.copy();
	_vec.y = vec1.y;
	return vec1.dot(_vec);
};

/**
 * 将反射/折射互换
 */
utils.switchFanSheZheShe = function(material, toZheShe) {
	if (toZheShe == undefined) {
		toZheShe = true;
	}
	if (material.envMap) {
		material.envMap.mapping = toZheShe ? THREE.CubeRefractionMapping : THREE.CubeReflectionMapping;
		material.needsUpdate = true;
	}
};

/**
 * 单独显示某个物体
 */
utils.alone = function(obj, all) {
	all = all || Game.instance.sea.meshes;

	for (var i = 0; i < all.length; i++) {
		var m = all[i];

		if (obj == null) {
			m.visible = true;
		} else {
			if (m != obj && m.parent != obj && obj.parent != m) {
				m.visible = false;
			}
		}
	};
};

/**
 * 淡入淡出
 * inout: true 淡入 | false 淡出
 * params:
 * 		min, max, inout
 */
utils.fade = function(obj, params) {
	if (obj) {
		clearInterval(obj.fadeid);
	}

    params = params || {};
    var mats = params.mats || utils.collectMaterials(obj);
	params.min = params.min || 0;
	params.max = params.max || 1;
	params.time = params.time || 1;
	if (params.inout == undefined) {
		params.inout = true;
	}

	var delta = params.max - params.min;

	obj.fadeid = ztc.Tween.fadeTo(params.time, function(t) {
		for (var i = 0; i < mats.length; i++) {
			var mat = mats[i];
			mat.transparent = true;
            // mat.alphaTest = 0;
			mat.opacity = params.inout ? (params.min + t * delta) : params.max - t * delta;
		};
	}, ztc.Tween.easeOutQuad, function() {
		delete obj.fadeid;
		if (params.callback) {
			params.callback();
		}
	});
};

/**
 * 设置物体及其所有子物体的透明度
 */
utils.setOpacity = function( mats, opacity ) {
	// var mats = utils.collectMaterials(obj);

	for (var i = 0; i < mats.length; i++) {
		var mat = mats[i];
		mat.transparent = true;
		mat.opacity = opacity;
	};
}

/**
 * 收集自身及所有子物体的材质
 */
utils.collectMaterials = function(obj) {
	var mats = [];

	// collect function
	function cm(o) {
		if (o.type && o.type != 'Dummy') {
			if (o.material) {
				if (o.material instanceof THREE.MultiMaterial) {
					for (var i = 0; i < o.material.materials.length; i++) {
						pushMat(o.material.materials[i]);
					};
				} else {
					pushMat(o.material);		
				}
			}
		}

		for (var j = 0; j < o.children.length; j++) {
			var c = o.children[j];
			cm(c);
		};
	}

	// invoke collect function
	cm(obj);

	function pushMat(mat) {
		if (mats.indexOf(mat) < 0) {
			mats.push(mat);
		}
	}

	return mats;
};

/**
 * 从数组中得到所有给定名字的物体
 */
utils.getObjectsFromArray = function(arr, names) {
	var ns = [].concat(names);
	var res = [];
	for (var i = 0; i < arr.length; i++) {
		var itm = arr[i];
		if (namse.indexOf(itm.name) > 0) {
			res.push(itm);
		}
	};
	return res;
};

/**
 * javascript string endWidth function
 */
if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/**
 * 模拟 Unity3D C# 中的 coroutine
 * var cor = utils.coroutine();
 * cor.push(fun (cb), cor.wait(2), fun ...);
 * cor.next(); 	// for one by one 
 * cor.start();	// for sequence
 * cor.stop();
 * cor.resume();
 * cor.reset();
 */
 utils.coroutine = function() {
    return (new function() {
        // 任务组
        this.works        = [];
        this.isWorking    = false;
        this.done         = false;
        this.doneCallback = null;
        this.index        = -1;
        this.isStop       = false;

        // 添加任务
        this.push = function(works) {
            var w = arguments;
            for (var i = 0; i < w.length; i++) {
                this.works.push( w[i] );
            };
        };

        // 下一个
        this.next = function() {
        	var s = this;
            if (s.isWorking) {
                return;
            }
            s.index += 1;
            var w = s.works[s.index];
            if (w) {
                s.isWorking = true;
                s.done = false;
                w(s.workComplete.bind(s));  // cb( bool ); true: continue false: stop
            }
        };

        // 完成work后,调用的方法
        this.workComplete = function( next ) {
            this.isWorking = false;

            if (next == undefined) {
                next = true;
            }
            
            if (this.index == this.works.length - 1) {
                this.done = true;
                this.index = -1;
                if (this.doneCallback) {
                    this.doneCallback();
                }
            } else if (next) {
                if (!this.isStop) {
                    this.next();
                }
            }
        };

        // wait for seconds
        this.wait = function( seconds ) {
            var s = this;
            return function() {
                setTimeout(function() {
                    s.workComplete();
                }, seconds * 1e3);
            }
        };

        // 开始序列
        this.start = function() {
            this.next();
        };

        // 停止序列
        this.stop = function() {
            this.isStop = true;
        };

        // 恢复序列
        this.resume = function() {
            this.isStop = false;
            this.next();
        };

        // 清空
        this.reset = function() {
			this.index     = -1;
			this.isWorking = false;
			this.works     = [];
			this.isStop    = false;
        };
    });
};

/**
 * 相机飞向另一个相机, 并在过程中相机Controller不可用
 * cameraTarget.name = camera.name + '.Target'
 */
utils.cameraFly = function(to, time, mode, from, cb) {
    from = from || Game.instance.camera;
    if (mode == undefined) {
        mode = Game.instance.cameraController.modes.LOCK;
    }
    if (time == undefined) {
        time = 1;
    }
    Game.instance.cameraController.enabled = false;
    utils.transformTo(from, to, time, null, function() {
        var target = Game.instance.getDummy(to.name + '.Target');
        if (target) {
            Game.instance.cameraController.target = target.position.clone();
            Game.instance.cameraController.setOrigin();
        }
        Game.instance.cameraController.mode = mode;
        Game.instance.cameraController.enabled = true;
        
        if (cb) { cb(); }
    });
};

/**
 * 在世界坐标系下旋转物体
 */
utils.rotateAroundWorldAxis = function ( object, axis, radians ) {
    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis( axis.normalize(), radians );
    rotationMatrix.multiply( object.matrix );                       // pre-multiply
    object.matrix = rotationMatrix;
    object.rotation.setFromRotationMatrix( object.matrix );
};

/**
 * 因为有部分机型中,声音文件不能自动播放, 所以需要在'按钮'的Click事件中
 * 执行这个方法, 先让声音无声的播放一下, 方便之后使用
 */
utils.prePlayAudio = function( audioSym ) {
    var auds = audioSym.$('audio');
    Array.prototype.forEach.call(auds, function(a) {
        (function(_a) {
            _a.muted = true;
            _a.play();
            setTimeout(function() {
                _a.muted = false;
                _a.pause();
                _a.currentTime = 0;
            }, 0);
        })(a);
    });
};

/**
 * transform a vector from world to local space
 */
THREE.Object3D.prototype.inverseTransformVector = function(v) {
    var _v = v.clone();
    var wm = this.matrix.clone();
    wm.setPosition(new THREE.Vector3());            // transform vector need to position origin
    wm = new THREE.Matrix4().getInverse(wm);        // world to local need inverse matrix
    return _v.applyMatrix4(wm);
};

/**
 * transfrom a vector from local to world space
 */
THREE.Object3D.prototype.transformVector = function(v) {
    var _v = v.clone();
    var wm = this.matrix.clone();
    wm.setPosition(new THREE.Vector3());            // transform vector need to position origin
    return _v.applyMatrix4(wm);
};
