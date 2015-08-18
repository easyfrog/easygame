
/**
 * 	Game 类
 *  封装Threejs的一些常用方法
 *  并定义了流程框架
 *  author: 	easyfrog
 *  date:   	2015/5/10
 *  sea3d: 		17000
 *  threejs: 	r71
 *
 * container: domElement
 * config: {
 * 	debug: false,
 * 	seaStandard: false,
 * 	rendererConfig: {
 * 		antialias: true,
 * 		alpha: true
 * 	}
 * }
 *
 * component's property: 	enabled, object
 * component's events: 		start, update, onMouseDown, onMouseUp, onMouseMove \
 * 							onPicked, onRemoveonKeyDown, onKeyUp
 */
(function(parent) {
	var Game = function(container, config) {
		var s = this;

		config = config || {};
		if (config.seaStandard == undefined) {
			config.seaStandard = false;
		}
		s.container = container;
		var rendererConfig = config.rendererConfig || {
			antialias: true,
			alpha: true
		}
		s.renderer = new THREE.WebGLRenderer(rendererConfig);
		s.container.appendChild(s.renderer.domElement);
		s.camera = new THREE.PerspectiveCamera(45, container.offsetWidth/container.offsetHeight, 0.1, 10000);
		s.camera.position.set(0,50,400);
		if (config.seaStandard) {
			s.camera.scale.set(-1,1,1);
		}
		s.cameraController = new THREE.OrbitControls(s.camera, container);
		s.scene = new THREE.Scene();
		s.sh = new SceneHandler('', s.scene, config.seaStandard);
		s.sea = s.sh.root;
		s.rootContainer = s.sh.container;

		// 是否暂停
		s.pause = false;
		s.isMouseDown = false;
		s.isAnimating = false;
		s.debug = config.debug || false;

		// EVENTS: start, update, progress, loadComplete
		s.start        = [];
		s.update       = [];
		s.postUpdate   = [];
		s.progress     = [];
		s.loadComplete = [];
		s.picked       = [];
		s.keydown      = [];
		s.keyup        = [];
		s.mousedown    = [];
		s.mousemove    = [];
		s.mouseup      = [];

		// 是否开启拾取物体事件
		s.enabledPickEvent = true;

		// 接受 点击事件的物体数组
		// 如果数组为空,则针对 game.scene 下所有物体
		// 些数组为了在场景物体数多的情况下
		// 只计算此数组中的物体,从而提高性能
		s.canPicked = [];
		s.components = [];

		// Animations
		s.animations = [];

		s.init();
	};

	Game.START        = 'start';
	Game.UPDATE       = 'update';
	Game.POSTUPDATE   = 'postUpdate';
	Game.PROGRESS     = 'progress';
	Game.LOADCOMPLETE = 'loadComplete';
	Game.PICKED       = 'picked';
	Game.KEYDOWN      = 'keydown';
	Game.KEYUP        = 'keyup';
	Game.MOUSEDOWN    = 'mousedown';
	Game.MOUSEMOVE    = 'mousemove';
	Game.MOUSEUP      = 'mouseup';

	Game.instance = null;

	Game.prototype.init = function() {
		var s = this;

		if (!Game.instance) {
			Game.instance = s;
		}

		s.setSize();
		s.addEvents();
		s._start();
		s._update();

		window.onresize = function() {
			s.setSize(window.innerWidth, window.innerHeight);
		};
	};

	var _lastMousePick, curMouse;
	Game.prototype.addEvents = function() {
		var s = this;

		// Mouse && Touch
		s.container.addEventListener('mousedown', onMouseDown, false);
		s.container.addEventListener('mousemove', onMouseMove, false);
		s.container.addEventListener('mouseup', onMouseUp, false);
		s.container.addEventListener('touchstart', onMouseDown, false);
		s.container.addEventListener('touchmove', onMouseMove, false);
		s.container.addEventListener('touchend', onMouseUp, false);

		// Key
		document.addEventListener('keydown', onKeyDown, false);
		document.addEventListener('keyup', onKeyUp, false);

		function onKeyDown(e) {
			s.invokeComponentFunction(this, 'onKeyDown', e.keyCode);
			s.invoke('keydown', e.keyCode);
		}

		function onKeyUp(e) {
			s.invokeComponentFunction(this, 'onKeyUp', e.keyCode);
			s.invoke('keyup', e.keyCode);
		}

		function onMouseDown(e) {
			e.preventDefault();
			s.isMouseDown = true;
			_lastMousePick = getPick(e);

			var p = getPick(e);
			var object = s.getPickObject(p);
			s.currentPicked = object;

			s.invokeComponentFunction(object, 'onMouseDown', e);
			s.invoke('mousedown', e);
		}

		function onMouseMove(e) {
			e.preventDefault();
			if (e.touches) {
				curMouse = getPick(e);
			}

			s.invokeComponentFunction(s.currentPicked, 'onMouseMove', e);
			s.invoke('mousemove', e);
		}

		function onMouseUp(e) {
			e.preventDefault();

			s.invokeComponentFunction(s.currentPicked, 'onMouseUp', e);
			s.invoke('mouseup', e);

			if (!e.touches) {
				curMouse = getPick(e);
			}
			if ((e.button == 0 || e.touches) && (s.enabledPickEvent || s.debug) && _lastMousePick.distanceTo(curMouse) < 5) {
				var object = s.getPickObject(curMouse);
				if (object) {
					s.invokeComponentFunction(object, 'onPicked', e);
					s.invoke(Game.PICKED, object);
				}
			}
			s.currentPicked = null;
			s.isMouseDown = false;
		}
	};

	/**
	 * get picked object
	 */
	Game.prototype.getPickObject = function(mousePosition, objects) {
		var s = this;
		var mx = ((mousePosition.x - s.container.offsetLeft) / s.container.offsetWidth) * 2 - 1;
		var my = -((mousePosition.y - s.container.offsetTop) / s.container.offsetHeight) * 2 + 1;
		var vector = new THREE.Vector3(mx, my, 1);
		vector.unproject(s.camera);
		var ray = new THREE.Raycaster(s.camera.position, vector.sub(s.camera.position).normalize());
		
		objects = objects || (s.canPicked.length == 0 ? s.scene.children : s.canPicked);
		var intersections = ray.intersectObjects(objects, true);
		if (intersections.length > 0) {
			return intersections[0].object;
		}
		return null;
	}

	/**
	 * 注册组件
	 */
	Game.prototype.registerComponents = function(componentsArr, path) {
		path = path || 'scripts/';
		for (var i = 0; i < componentsArr.length; i++) {
			var com = componentsArr[i];
			utils.include(path + com + '.js');
		};
		console.log('registe ' + componentsArr);
	};

	/**
	 * 注销组件
	 */
	Game.prototype.unregisterComponents = function(componentsArr) {
		for (var i = 0; i < componentsArr.length; i++) {
			window[componentsArr[i]] = undefined;
		};
	};	

	/**
	 * 向物体上添加组件
	 */
	THREE.Object3D.prototype.addComponent = function(comName) {
		var s = this;
		if (window[comName]) {
			var com = new window[comName]();
			com.object = this;
			com.name = comName;
			com.enabled = true;
			s.components = this.components || [];
			s.components.push(com);

			Game.instance.components.push(com);
			saveInvoke(com, 'start');
		} else {
			setTimeout(function() {
				s.addComponent(comName);
			}, 0);
		}
	};

	THREE.Object3D.prototype.getComponent = function(comName) {
		if (this.components) {
			for (var i = 0; i < this.components.length; i++) {
				var com = this.components[i];
				if (com.name == comName) {
					return com;
				}
			};
		}
		return null;
	}

	THREE.Object3D.prototype.removeComponent = function(comName) {
		if (this.components) {
			var _com = this.getComponent(comName);
			saveInvoke(_com, 'onRemove');
			var index = Game.instance.components.indexOf(_com);
			Game.instance.components.splice(index, 1);
			index = this.components.indexOf(_com);
			this.components.splice(index, 1);
		}
	};

	function saveInvoke (object, fun, param) {
		if (object[fun] && object.enabled) {
			object[fun](param);
		}
	}

	/**
	 * get mouse screen position
	 */
	function getPick(e) {
		try {
			return new THREE.Vector2( (e.touches ? e.touches[0].clientX : e.clientX),
								   (e.touches ? e.touches[0].clientY : e.clientY) );
		} catch (e) {
			return null;
		}
	}

	Game.prototype.setSize = function(w, h) {
		if (w == undefined) {
			w = this.container.offsetWidth;
		}
		if (h == undefined) {
			h = this.container.offsetHeight;
		}

		this.renderer.setSize(w, h);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	};

	Game.prototype.getDeltaTime = function() {
		return this.sh.deltaTime;
	};

	Game.prototype.getTime = function() {
		return this.sh.clock.getElapsedTime();
	};

	Game.prototype.addEventListener = function(type, listener) {
		this[type].push(listener);
	};

	Game.prototype.removeEventListener = function(type, listener) {
		removeElement(this[type], listener);
	};

	function removeElement(arr, elem) {
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == elem) {
				arr.splice(i, 1);
			}
		}		
	}

	Game.prototype.invoke = function(type, param) {
		var t = this[type];
		if (this.debug && type != Game.UPDATE && type != Game.POSTUPDATE && type != Game.MOUSEMOVE) {
			console.log('-> ', type, ' event: ', param);
		};
		for (var i = 0; i < t.length; i++) {
			t[i](param);
		}
	};

	Game.prototype._start = function() {
		this.invoke('start');
	};

	Game.prototype._update = function() {
		requestAnimationFrame(this._update.bind(this));

		if (this.pause) {
			return;
		}

		this.sh.update();

		// component update 
		this.invokeComponentFunction(this, 'update');

		// update functions
		this.invoke(Game.UPDATE);
		// update animations
		for (var i = 0; i < this.animations.length; i++) {
			this.animations[i].update(this.getDeltaTime() * 1000);
		};

		if (this.cameraController) {
			this.cameraController.update();
		}
		this.renderer.render(this.scene, this.camera);
		this.invoke(Game.POSTUPDATE);
	};

	/**
	 * 调用组件的主要方法
	 */
	Game.prototype.invokeComponentFunction = function(object, functionName, param) {
		if (!object || !object.components) {
			return;
		}
		for (var i = 0; i < object.components.length; i++) {
			var com = object.components[i];
			if (!com.enabled) {
				continue;
			}
			if (com[functionName]) {
				com[functionName](param);
			}
		};
	};

	// 导入sea文件
	Game.prototype.load = function(url, groupName) {
		var s = this;

		s.sh.load(url, groupName);
		s.sh.onProgress = function(p) {
			s.invoke(Game.PROGRESS, p.progress);		
		};
		s.sh.onComplete = function() {
			s.invoke(Game.LOADCOMPLETE, groupName);
		};
	};

	/**
	 * 清空场景,只保留rootContainer
	 */
	Game.prototype.clearScene = function() {
		var s = this;
		var rc = s.rootContainer;
		while (rc.children.length > 0) {
			rc.remove(rc.children[0]);
		}

		s.sea.objects = {};
	};

	/**
	 * 清除指定的组
	 */
	Game.prototype.removeGroup = function(groupName) {
		this.rootContainer.remove(this.getGroup(groupName));
	};

	/**
	 * 得到指定的组
	 */
	Game.prototype.getGroup = function(groupName) {
		return this.rootContainer.getObjectByName(groupName);
	};

	/**
	 * 让有贴图的材质自发光
	 * @param  {number} mapVal   有贴图的自发光强度
	 * @param  {number} noMapVal 没有贴图的材质的自发光强度
	 */
	Game.prototype.letTextureEmissive = function(mapVal, noMapVal) {
		mapVal = mapVal || 1;
		noMapVal = noMapVal || 0.6;

		var mats = this.sh.root.materials;
		if (!mats) {
			return;
		}
		for (var i = 0; i < mats.length; i++) {
			mats[i].emissive = new THREE.Color( mats[i].color ).multiplyScalar(
				mats[i].map ? mapVal : noMapVal
			);
		}
	};

	/**
	 * 播放基础P.R.S.动画
	 */
	Game.prototype.playGeneralAnimation = function(animationName) {
		animationName = animationName || 'general';
		game.sh.play(animationName);		
	};

	/**
	 * 得到相机与控制器的位置数据
	 */
	Game.prototype.printCameraInfo = function() {
		var p = this.camera.position;
		var r = this.camera.rotation;
		var t = this.cameraController.target;
		console.log('position:', p.x.toFixed(2) + ',' + p.y.toFixed(2) + ',' + p.z.toFixed(2), 
					'rotation:', r.x.toFixed(2) + ',' + r.y.toFixed(2) + ',' + r.z.toFixed(2),
					'target:', t.x.toFixed(2) + ',' + t.y.toFixed(2) + ',' + t.z.toFixed(2));
	};

	parent.Game = Game;
})(window);