
/**
 * 	Game 类
 *  封装Threejs的一些常用方法
 *  并定义了流程框架
 *  author: 	easyfrog
 *  date:   	2015/5/10
 *  sea3d: 		18000
 *  threejs: 	r76
 *  url:        https://github.com/easyfrog/easygame
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
 *
 * mesh: mouseEnabled  是否可以被 getPickedObject
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
		s.renderer.autoClear = false;
		// s.renderer = new THREE.CanvasRenderer(rendererConfig);
		s.container.appendChild(s.renderer.domElement);
		s.camera = new THREE.PerspectiveCamera(50, container.offsetWidth/container.offsetHeight, 1, 10000);
		s.camera.position.set(0,50,400);
		if (config.seaStandard) {
			s.camera.scale.set(-1,1,1);
		}
		s.cameraController;
		// s.cameraController = new THREE.OrbitControls(s.camera, container);
		s.scene = new THREE.Scene();
		s.sh = new SceneHandler('', s.scene, config.seaStandard);
		s.sea = s.sh.root;
		s.rootContainer = s.sh.container;
		s.mouseMovement = new THREE.Vector2(0, 0);
		s.width = 100;
		s.height = 100;
		s.stageScale = window.t ? window.t.stageScale : 1;

		// custorm render
		s.custormRenderFunction = null;

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
		s.canPicked  = [];
		s.components = [];
		s.layers     = {};	// 层

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

		window.addEventListener('resize', function() {
			s.width = Game.instance.container.offsetWidth;
			s.height = Game.instance.container.offsetHeight;
			s.setSize(s.width, s.height);
		});
	};

	Game.prototype.setOrbitController = function() {
		this.cameraController = new THREE.OrbitControls(this.camera, this.container);
		this.cameraController.zoomSpeed = 0.5;
	};

	var _lastMousePick, curMouse, lastMouse;
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
			s.invokeComponentFunction(this, 'onKeyDown', e);
			s.invoke('keydown', e);
		}

		function onKeyUp(e) {
			s.invokeComponentFunction(this, 'onKeyUp', e);
			s.invoke('keyup', e);
		}

		function onMouseDown(e) {
			e.preventDefault();
			s.isMouseDown = true;
			_lastMousePick = getPick(e);
			lastMouse = _lastMousePick;

			var object = s.getPickObject(_lastMousePick);
			s.currentPicked = object;
			lastMouse = curMouse = _lastMousePick;

			s.invokeComponentFunction(object, 'onMouseDown', e);
			s.invoke('mousedown', e);
		}

		function onMouseMove(e) {
			e.preventDefault();
			// if (e.touches) {
				curMouse = getPick(e);
			// }
			if (lastMouse) {
				s.mouseMovement = curMouse.clone().sub(lastMouse);
				lastMouse = curMouse;
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
				var object = s.currentPicked;
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
	 * 给Mesh物体添加了一个 mouseEnabled 属性
	 * 如果这个没有这个属性, 则默认视为 mouseEnabled = true
	 */
	Game.prototype.getPickObject = function(mousePosition, objects) {
		var s = this;
		var mx = ((mousePosition.x - s.container.offsetLeft) / (s.width * s.stageScale)) * 2 - 1;
		var my = -((mousePosition.y - s.container.offsetTop) / (s.height * s.stageScale)) * 2 + 1;

		var vector = new THREE.Vector3(mx, my, 0);
		vector.unproject(s.camera);
		var ray = new THREE.Raycaster(s.camera.position, vector.sub(s.camera.position).normalize());

		objects = objects || (s.canPicked.length == 0 ? s.scene.children : s.canPicked);
		var intersections = ray.intersectObjects(objects, true);
		if (intersections.length > 0) {
			// check if mouse enabled
			for (var i = 0; i < intersections.length; i++) {
				var obj = intersections[i].object;
				if (!('mouseEnabled' in obj) || obj.mouseEnabled) {
					Game.instance.lastPickedObj = obj;
					return obj;
				}
			};
			return null;
		}
		return null;
	}

	/**
	 * 向物体上添加组件
	 */
	THREE.Object3D.prototype.addComponent = function(comNameOrFunc, params) {
		var s = this;
		var com;

		if (typeof comNameOrFunc == 'string') {
			if (window[comNameOrFunc]) {
				com = new window[comNameOrFunc](params);
				com.name = comNameOrFunc;
			} else {
				console.log('addComponent: not have ' + comNameOrFunc + ' component yet.');
				return null;
			}
		} else if (typeof comNameOrFunc == 'function') {
			com = new comNameOrFunc(params);
			com.name = com.name;
		}

		com.object = this;
		com.enabled = true;
		s.components = this.components || [];
		s.components.push(com);

		Game.instance.components.push(com);
		saveInvoke(com, 'start');

		console.log('-> addComponent:', com.name, params);

		return com;
	};

	THREE.Object3D.prototype.getComponent = function(comNameOrFunc) {
		if (this.components) {
			var isStr = typeof comNameOrFunc == 'string';
			for (var i = 0; i < this.components.length; i++) {
				var com = this.components[i];
				if (isStr) {
					if (com.name == comNameOrFunc) {
						return com;
					}
				} else {
					if (com instanceof comNameOrFunc) {
						return com;
					}
				}
			};
		}
		return null;
	}

	THREE.Object3D.prototype.removeComponent = function(comNameOrFunc) {
		if (this.components) {
			var _com = this.getComponent(comNameOrFunc);
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

		// this.width = w * this.stageScale;
		// this.height = h * this.stageScale;
		this.width = w;
		this.height = h;
		this.renderer.setSize(w, h);
		this.renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
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
			if (type == Game.PROGRESS) {
				console.log('-> ', type, ' event:', param.progress, ' type:', param.type);
			} else if (type == Game.LOADCOMPLETE) {
				console.log('-> ', type, ' event:', param.name);
			} else {
				console.log('-> ', type, ' event:', param);
			}
		};

		for (var i = 0; i < t.length; i++) {
			if (t[i](param)) {	// 如果在遍历的过程中,需要移除数据,需将 i 回退 1.
				i--;
			}
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

		this.renderer.clear();

		var _delta = this.getDeltaTime() * 1000;

		this.sh.update();
		
		if (THREE.Sound3D) {
			THREE.Sound3D.update(this.camera);
		}

		// component update 
		this.invokeComponentFunction(this, 'update');

		// update functions
		this.invoke(Game.UPDATE, _delta);
		// update animations
		for (var i = 0; i < this.animations.length; i++) {
			this.animations[i].update(_delta);
		};
		
		if (this.custormRenderFunction) {
			this.custormRenderFunction(_delta);	
		} else {
			this.renderer.render(this.scene, this.camera);
		}
		
		this.invoke(Game.POSTUPDATE, _delta);
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
	Game.prototype.load = function(url, groupName, callback) {
		var s = this;

		function cb() {
			s.removeEventListener(Game.LOADCOMPLETE, cb);
			callback(groupName);
			return true;	// 因为需要在遍历中移除数组元素,所以需要此函数返回一个true值,使用遍历索引回退1.
		}

		if (callback) {
			s.addEventListener(Game.LOADCOMPLETE, cb);
		}

		s.sh.load(url, groupName);
		if (!s.sh.onProgress) {
			s.sh.onProgress = function(p) {
				if (!isNaN(p.progress)) {
					s.invoke(Game.PROGRESS, p);		
				}
			};
		}

		if (!s.sh.onComplete) {
			s.sh.onComplete = function() {
				s.invoke(Game.LOADCOMPLETE, s.sh.currentGroup);
			};			
		}
	};

	/**
	 * load multiple sea files
	 * _seas : [{
	 * 		seas: ['xx.sea', 'xx.sea'],		// or single file string
	 * 		groupName: 'xxx',
	 * 		callback: function() {}
	 * }]
	 * seas : ['xx.sea', 'xx.sea']
	 */
	Game.prototype.loadSeas = function(seas, groupName, callback) {
		var s = this;
		var count = 0;
		var alldone = false;

		if (typeof seas == 'string') {
			seas = [seas];
		}

		function cb (gn) {
			// console.log('--> loadSeas:' + gn + ' loaded. alldone: ' + alldone);
			if (gn.name != groupName) {		// if not my groupName return
				return;
			}

			var removele = false;	// if remove a listener need to return true

			alldone = false;
			count ++;

			if (count == seas.length) {
				alldone = true;
				s.removeEventListener(Game.LOADCOMPLETE, cb);
				removele = true;
			}

			if (callback) {
				callback(alldone, count, seas.length, gn);
			}

			return removele;
		};

		if (callback) {
			this.addEventListener(Game.LOADCOMPLETE, cb);
		}

		for (var i = 0; i < seas.length; i++) {
			var sea = seas[i];

			if (typeof sea == 'string') {
				s.load(sea, groupName);
			} else if (typeof sea == 'object') {
				s.loadSeas(sea.seas, sea.groupName, sea.callback);
			}
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

	Game.prototype.getMesh = function(name) {
		return getFromArray(this.sea.meshes, name);
	};

	Game.prototype.getCamera = function(name) {
		return getFromArray(this.sea.cameras, name);
	};

	Game.prototype.getLight = function(name) {
		return getFromArray(this.sea.lights, name);
	};

	Game.prototype.getDummy = function(name) {
		return getFromArray(this.sea.dummys, name);
	};

	Game.prototype.getCubeMap = function(name) {
		return getFromArray(this.sea.cubemaps, name);
	};

	Game.prototype.getTexture = function(name) {
		return getFromArray(this.sea.textures, name);
	};

	Game.prototype.getMaterial = function(name) {
		return getFromArray(this.sea.materials, name);
	};

	Game.prototype.getLine = function(name) {
		return getFromArray(this.sea.lines, name);
	}

	Game.prototype.getSprite = function(name) {
		return getFromArray(this.sea.sprites, name);
	};

	function getFromArray(arr, name) {
		if (!arr) {return null;}
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			if (item.name == name) {
				return item;
			}
		};
		return null;
	}

	/**
	 * 让有贴图的材质自发光
	 * @param  {number} mapVal   有贴图的自发光强度
	 * @param  {number} noMapVal 没有贴图的材质的自发光强度
	 */
	Game.prototype.letTextureEmissive = function(mapVal, noMapVal, exceptMats) {
		mapVal = mapVal || 1;
		noMapVal = noMapVal || 0.6;

		var mats = this.sh.root.materials;
		if (!mats) {
			return;
		}
		for (var i = 0; i < mats.length; i++) {
			if (exceptMats && exceptMats.indexOf(mats[i].name) != -1) {
				return;
			}
			mats[i].emissive = new THREE.Color( mats[i].color ).multiplyScalar(
				mats[i].map ? mapVal : noMapVal
			);
		}
	};

	/**
	 * 播放基础P.R.S.动画
	 */
	Game.prototype.playGeneralAnimation = function(animationName, timeScale, repeat, callback) {
		animationName = animationName || 'general';
		Game.instance.sh.play(animationName, timeScale, repeat, callback);		
	};

	/**
	 * 指定物体(组), 来播放指定的动画
	 */
	Game.prototype.playAnimation = function(objects, animationName, timeScale, retainPos, whenFirstComplete) {
		animationName = animationName || 'general';
		timeScale = timeScale || 1;

		objects = objects || Game.instance.sea.meshes;
		if (!(objects instanceof Array)) {
			objects = [].concat(objects);
		}
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			var anim = obj.animation || obj.animator;
			var animNode;
			if (anim) {
				if (anim.animationSet) {
					animNode = anim.animationSet.animations[animationName];
				} else {
					animNode = anim.animations[animationName];
				}
			}

			if (anim && animNode) {
				if (i == 0) {
					var clip = anim.animationsData ? anim.animationsData[animationName] : anim;
					var oldAnimComplete = clip.onComplete;
					clip.onComplete = function() {
						if (whenFirstComplete) {
							whenFirstComplete();
						}
						clip.onComplete = oldAnimComplete;
					};
				}
				if (anim.setTimeScale) {
					anim.setTimeScale(timeScale);
				} else {
					anim.timeScale = timeScale;
				}

				offset = retainPos && anim.currentAnimationAction ? anim.currentAnimationAction.time : undefined;
				anim.play(animationName, 0, offset);
			}
		};
	};

	/**
	 * 批量得到物体
	 */
	Game.prototype.getObjects = function(nameArr, type) {
		var res = [];
		nameArr.concat([]);
		type = type || 'm3d';
		for (var i = 0; i < nameArr.length; i++) {
			res.push(this.sea.objects[type + '/' + nameArr[i]])
		}
		return res;
	};

	parent.Game = Game;
})(window);