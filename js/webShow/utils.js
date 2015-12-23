/**
 * 工具类
 */
var utils = utils || {};

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
	if (mesh.geometry instanceof THREE.BufferGeometry) {
		var geo = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
		utils.fixMorphTargets(geo);
		mesh.geometry = geo;
	}

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
utils.sameTransform = function(from, to, inverse, nop, nor, nos) {
	var toap = to.getWorldPosition();
	var toaq = to.getWorldQuaternion();
	var toas = to.getWorldScale();

	if (!nop) {
		from.position.set(toap.x, toap.y, toap.z);
	}
	if (!nor) {
		from.quaternion.set(toaq.x, toaq.y, toaq.z, toaq.w);
		}
	if (!nos) {
		from.scale.set(toas.x, toas.y, toas.z);
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
utils.setAnimationTime = function(animation, stateName, percent) {
	if (stateName in animation.states) {
		try {
			if (percent < 0) {
				percent = 0;
			} else if (percent > 1) {
				percent = 1;
			}

			var duration = animation.states[stateName].node.duration;
			// animation.currentState = animation.states[stateName];
			animation.stop();
			animation.states[stateName].node.setTime(percent * duration);
			animation.updateAnimation(stateName);
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
utils.followAnimation = function(obj, target, stateName, inverse, complete) {
	var _tmp = function() {
		utils.sameTransform(obj, target, inverse);
	}

	target.animation.play(stateName);
	Game.instance.addEventListener(Game.UPDATE, _tmp);

	target.animation.onComplete = function() {
		target.animation.onComplete = null;
		Game.instance.removeEventListener(Game.UPDATE, _tmp);
		if (complete) {
			complete();
		}
	}
}

/**
 * 得到相机的方向向量
 */
utils.cameraDirection = function(camera) {
	var vector = new THREE.Vector3(0, 0, -1);
   	vector.applyEuler(camera.rotation, camera.eulerOrder);
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
 * javascript string endWidth function
 */
if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}
