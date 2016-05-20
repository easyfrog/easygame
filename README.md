#easygame
A [threejs](https://github.com/mrdoob/three.js) and [sea3d](https://github.com/sunag/sea3d) 3D game engine. 
and use browserify to manange components.
use Grunt to publish.

#### edit tool:	
- sublime text 3

#### plugins:
- Git
- grunt
- grunt-browserify
- [TernJs](https://github.com/emmetio/sublime-tern)


##创建新工程
使用 [grunt](http://www.gruntjs.net/) 来创建新的 **easygame** 工程目录并生成标准js文件及此工程的grunt构建文件.

** 目标路径的盘符后要加一个'\'进行转义. 使用'/'进行文件夹的分隔, 并且结尾不要加'/' **
```
grunt create:projectName:E\:/projects/projectName
```

并会在 `projects` 文件夹中生成工程的目录:  

- projects
	- projectName
		- projectName.js
		- projectName_grunt.js

构建(发布)工程  
直接使用 `grunt 工程名` 即可完成工程的打包及发布
```
grunt projectName

// publish with specified version of threejs and sea3d
grunt projectName:r76 // r72 default
```

如果你创建了很多项目时,因为默认ternjs会检测所有projects下面的js文件.所以在提示上会出现很多相似的内容.所以增加了可以`关闭/开启`项目的功能. 关闭的项目会自动的转移到`projects/_closed/`目录下面.相就的如果开启项目.此项目会转移回`projects`目录下.

```
// 关闭项目(支持多个项目一起关闭)
grunt --no-color close:project1:...projectN

// 开启项目(支持多个项目一起开启)
grunt --no-color open:project1:...projectN
```

##Game class
The Game main class.

###创建Game类

``` javascript
var game = new Game(domContainer, {
		rendererConfig: {
			antialias: true,	
			alpha: true			// 背景透明
		},
		debug: true				// 会在Console中打印出信息
	});
```

###Game类属性
* **container**:		放置内容的Dom元素
* **renderer**: 		Threejs 渲染类
* **camera**:			相机
* **cameraController**:	相机控制器
* **scene**: 			Threejs 场景
* **sh**:				Sea3D 场景管理类
* **sea**:				Sea3D 实例
* **pause**: 			是否暂停(停止update)
* **isMouseDown**:		鼠标是否被按下
* **debug**:			是否在控制台中打印出信息
* **canPicked**: 		(数组)用于计算RayCast的物体,如果不设置即为Scene里的所有Mesh物体
* **components**:		(数组)注册的组件类实例
* **animations**:		(数组)场景中的所有动画

###Game类事件
所有事件即为 string 类型  

* **Game.START**:        'start'  
* **Game.UPDATE**:       'update'  
* **Game.POSTUPDATE**:   'postUpdate'  
* **Game.PROGRESS**:     'progress'  
* **Game.LOADCOMPLETE**: 'loadComplete'  
* **Game.PICKED**:       'picked'  
* **Game.KEYDOWN**:      'keydown'  
* **Game.KEYUP**:        'keyup'  
* **Game.MOUSEDOWN**:    'mousedown'  
* **Game.MOUSEMOVE**:    'mousemove'  
* **Game.MOUSEUP**:      'mouseup'  

###Game类方法
1. **得到点击的Mesh物体:(物体必须有UV信息才能正确被拾取,否则会报错)**
``` javascript
game.getPickObject(mousePosition, objects)
return object || null;
```

 * **mousePosition**:	鼠标屏幕位置
 * **objects**: 		 	计算RayCast的Mesh物体集合: 		objects = objects || (game.canPicked.length == 0 ? game.scene.children : game.canPicked);
 * **return**:			所拾取到的物体或null  

2. **注册组件: (弃用)**
``` javascript
game.registerComponents(components)
```

* __components__: (数组) 如: ['com_MyCom', 'com_OtherCom', ...]
* __return__: null

3. **载入单个sea文件**
```
game.load('url', 'gruntName', callback);
game.addEventListener(Game.LOADCOMPLETE, onLoadComplete);

function onLoadComplete(groupName) {
	game.removeEventListener(Game.LOADCOMPLETE, onLoadComplete);
	...
};
```

4. **同时载入多个sea文件**
```
game.loadSeas(seasArray, groupName, callback, groupName);
game.loadSeas(['xx.sea, xx.sea'], 'groupName', function(alldone(boolean), count(int), allCount(int)) {}, groupName(str));

// config mode
game.loadSeas([
	{
		seas:['xx.sea', 'xxx.sea'],
		groupName: 'xxx',
		callback: function(alldone, count, allCount, groupName) {}
	},
	{
		seas:'xxxx.sea',
		groupName: 'xxx',
		callback: function(alldone, count, allCount, groupName) {}
	}
]);
```

5. 设置贴图的minFilter
```
material.map.minFilter = THREE.NearestFilter;
material.map.needsUpdate = true;
```

6. 得到 sea 中的物体:
```
	// 这个方法. 可以直接返回相应的类型,
	// 如果使用game.sea.getMesh... 只能得到最后Load进来的sea文件里面的数据,并且类型为Object
	game.getMesh(name);
	getCamera, getLight, getMaterial, getDummy, getCubMap, getTexture
```


##continue...

###Component 组件

可以为单个Mesh物体添加组件.(单独的Js文件), 些文件的命名规则为'com_XXX.js'. 组件文件默认要放在 scripts/ 文件目录下.

**组件的事件**
>start, update, onMouseDown, onMouseUp, onMouseMove
onPicked, onRemoveonKeyDown, onKeyUp

* **注册组件 (弃用)**
```javascript
game.registerComponents(['com_MyCom1', 'com_MyCom2', ...]);
game.unregisterComponents(['com_MyCom1', 'com_MyCom2', ...]);
```

* **新的组件使用方式**
```javascript
var com = require('./comName');
mesh.addComponent(com);
```

mesh.addComponent(comNameOrFunc); 推荐使用 require 进来的 COM 类
* **组件的一些方法**
```javascript
mesh.addComponent('com_MyCom1'); // 同上
mesh.removeComponent('com_MyCom1');
mesh.getComponent('com_MyCom1');
```

###对SEA3D Animation操作的一些补充

**基础操作**

```javascript
mesh.animation.play(stateName);
mesh.animation.pause();
mesh.animation.resume();
mesh.animattion.stop();

mesh.animation.time
mesh.animation.states['open'].node.frame

// 指定动画位置(goToAndStop)
mesh.animation.states['open'].node.setTime(time);
mesh.animation.updateAnimation();
// 也可以使用工具类完成同样的操作
utils.setAnimationTime(animation, stateName, time);

// morph Animation
mesh.setWeight('morphTarget', 0~1);
or
utils.morphObject(mesh, {duration: 1000, loop: false});
```

**动画事件**

```javascript
// 动画完成事件
mesh.animation.onComplete = function(anim) {};

// 帧事件 注: 尽量不要在第一帧与最后一帧上绑定事件
mesh.animation.keyframeEvents = {
	'1': function() {},
	'8': function() {},
	...
}
```

