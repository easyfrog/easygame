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
 */
utils.morphObject = function(game, mesh, params) {
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

	game.animations.push(mor);
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
	var p = inverse ? -1 : 1;
	if (!nop) {
		from.position.set(to.position.x, to.position.y, to.position.z);
	}
	if (!nor) {
		from.rotation.set(p * to.rotation.x, p * to.rotation.y, to.rotation.z);
	}
	if (!nos) {
		from.scale.set(to.scale.x, to.scale.y, to.scale.z);
	}
};

/**
 * 将一个物体的位置与旋转属性渐变至另一个物体处
 */
utils.transformTo = function(from, to, time, cv, over, update) {
	if (!ztc.Tween) {
		console.warn('utils.cameraFlyTo: Do not have ztc.Tween!');
		return;
	};

	cv = cv || ztc.Tween.easeOutQuad;

	var qm = new THREE.Quaternion();
	var qa = from.quaternion.clone();
	var qb = to.quaternion;

	ztc.Tween.isDom = false;
    if (!time) {time = 1};
    ztc.Tween.actionArrayProps([from.position], time, 
	   [{
	   		x:to.position.x,
	   		y:to.position.y,
	   		z:to.position.z		
	   }], cv, over, function(f) {
		   	THREE.Quaternion.slerp(qa, qb, qm, f);
		   	from.quaternion.set(qm.x, qm.y, qm.z, qm.w);
		   	if (update) {
		   		update(f);
		   	}
	});
};


/**
 * 将3D世界的点,转化为屏幕坐标
 */
utils.toScreenPosition = function(vector, camera) {
	var _v = new THREE.Vector3(vector.x, vector.y, vector.z);
    var widthHalf = 0.5 * Game.instance.container.offsetWidth;
    var heightHalf = 0.5 * Game.instance.container.offsetHeight;

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
	var mx = ((mousePosition.x - s.container.offsetLeft) / s.container.offsetWidth) * 2 - 1;
	var my = -((mousePosition.y - s.container.offsetTop) / s.container.offsetHeight) * 2 + 1;
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
utils.setAllAnimationTime = function(game, stateName, percent) {
	for (var i = 0; i < game.sea.meshes.length; i++) {
		var mesh = game.sea.meshes[i];
		if (mesh.animation) {
			utils.setAnimationTime(mesh.animation, stateName, percent);
		}
	};
};

/**
 * 让物体跟随一个物体的动画去改变位置与旋转
 */
utils.followAnimation = function(game, obj, target, stateName, inverse, complete) {
	function _tmp() {
		utils.sameTransform(obj, target, inverse);
	}

	game.addEventListener(Game.UPDATE, _tmp);
	target.animation.play(stateName);

	target.animation.onComplete = function() {
		target.animation.onComplete = null;
		game.removeEventListener(Game.UPDATE, _tmp);
		if (complete) {
			complete();
		}
	}
}