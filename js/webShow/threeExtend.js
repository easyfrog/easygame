
/**
 * MorphAnimation update function
 * 解决了开始播放时跳的问题
 */
THREE.MorphAnimation.prototype.update = ( function () {
	var lastFrame = 0;
	var currentFrame = 0;

	return function ( delta ) {
		if ( this.isPlaying === false ) return;
		this.currentTime += delta;
		if ( this.loop === true && this.currentTime > this.duration ) {
			this.currentTime %= this.duration;
		}
		this.currentTime = Math.min( this.currentTime, this.duration );
		var interpolation = this.duration / this.frames;
		var frame = Math.floor( this.currentTime / interpolation );

		if ( frame != currentFrame ) {
			this.mesh.morphTargetInfluences[ lastFrame ] = 0;
			this.mesh.morphTargetInfluences[ currentFrame ] = 1;
			this.mesh.morphTargetInfluences[ frame ] = 0;

			lastFrame = currentFrame;
			currentFrame = frame;
		}

		this.mesh.morphTargetInfluences[ frame ] = ( this.currentTime % interpolation ) / interpolation;
		if (lastFrame != frame) {
			this.mesh.morphTargetInfluences[ lastFrame ] = 1 - this.mesh.morphTargetInfluences[ frame ];
		}
	}
} )();

/**
 * SEAD.AnimationHandler
 */
SEA3D.AnimationHandler.prototype.updateAnimation = function(stateName) {
	var dataCount = this.animationSet.dataCount;		
	var nodes = this.animationSet.animations;

	// easyfrog modify
	var currentNode = stateName == undefined ? this.currentState.node : this.getStateByName(stateName).node;
	
	for(var i = 0; i < dataCount; i++) {
		for(var n = 0; n < nodes.length; n++) {
			var node = nodes[n],
				state = this.states[n],
				data = node.dataList[i],				
				iFunc = SEA3D.Animation.DefaultLerpFuncs[data.kind],
				frame;
			
			if (n == 0) {
				frame = currentNode.getInterpolationFrame(currentNode.dataList[i], iFunc);
				
				// make sure invoke one time
				var _fr = this.timeScale >= 0 ? Math.floor(currentNode.frame) : Math.ceil(currentNode.frame);
				if (_fr != this._lastFrame) {
					this._lastFrame =_fr;
					var _frame = _fr + '';

					// keyframe event
					if (this.keyframeEvents) {
						if (this.keyframeEvents[_frame]) {
							this.keyframeEvents[_frame]();
						}
					}

					if (!currentNode.repeat && 
						((this.timeScale > 0 && currentNode.frame == currentNode.numFrames - 1) ||
						(this.timeScale < 0 && currentNode.frame == 0))) {
						if (this.onComplete)
							this.onComplete( this );

						// !repeat pause
						this.pause();
					}
				}
			}
			
			if (node != currentNode) {
				if (state.weight > 0)
				{													
					iFunc(
						frame.data, 
						node.getInterpolationFrame(data, iFunc).data, 
						state.weight
					);	
				}
			}
						
			if (this.updateAnimationFrame)
				this.updateAnimationFrame(frame, data.kind);
		
		}
	}
}

SEA3D.AnimationHandler.update = function( delta ) {	
	for(var i = 0, len = SEA3D.AnimationHandler.animations.length; i < len; i++) {
		if (SEA3D.AnimationHandler.animations[i]) {
			SEA3D.AnimationHandler.animations[i].update( delta * 1000 );
		}
	}
}

/*
//
//	Vertex Animation
//

SEA3D.VertexAnimation = function( name, data, sea ) {

	this.name = name;
	this.data = data;
	this.sea = sea;

	SEA3D.AnimationBase.read( this );

	var flags = data.readUByte();

	this.isBigMesh = ( flags & 1 ) != 0;

	data.readVInt = this.isBigMesh ? data.readUInt : data.readUShort;

	this.numVertex = data.readVInt();
	this.length = this.numVertex * 3;

	var useVertex = ( flags & 2 ) != 0;
	var useNormal = ( flags & 4 ) != 0;

	this.frame = [];

	var i, j;

	for ( i = 0; i < this.numFrames; i ++ ) {

		if ( useVertex ) {

			var verts = [];

			j = 0;
			while ( j < this.length ) {

				verts[ j ++ ] = data.readFloat();

			}

		}

		if ( useNormal ) {

			var norms = [];

			j = 0;
			while ( j < this.length ) {

				norms[ j ++ ] = data.readFloat();

			}

		}

		this.frame[ i ] = { vertex: verts, normal: norms }

	}

}

SEA3D.VertexAnimation.prototype.type = "vtxa";


THREE.SEA3D.VertexAnimationMesh = function ( geometry, material, fps ) {

	THREE.MorphAnimMesh.call( this, geometry, material );

	this.fps = fps !== undefined ? fps : 30;
	this.animations = geometry.animations;

	this.isPlaying = false;
	this.totalTime = 0;

	this.playingCallback = this.updateAnimation.bind( this );

};

THREE.SEA3D.VertexAnimationMesh.prototype = Object.create( THREE.MorphAnimMesh.prototype );
THREE.SEA3D.VertexAnimationMesh.prototype.constructor = THREE.SEA3D.VertexAnimationMesh;

THREE.SEA3D.VertexAnimationMesh.prototype.play = function( name, offset ) {

	var animation = this.animations[ name ];

	this.setFrameRange( animation.start ? animation.start : 1, animation.end - 1 );
	this.duration = ( animation.end - animation.start ) / this.fps;
	this.time = offset !== undefined ? offset : this.time;

	this.resume();

}

THREE.SEA3D.VertexAnimationMesh.prototype.pause = function() {

	if ( this.isPlaying ) {

		this.isPlaying = false;
		THREE.SEA3D.AnimationHandler.removeUpdate( this.playingCallback );

	}

}

THREE.SEA3D.VertexAnimationMesh.prototype.resume = function() {

	if ( ! this.isPlaying ) {

		this.isPlaying = true;
		// THREE.SEA3D.AnimationHandler.addUpdate( this.playingCallback );
		THREE.SEA3D.AnimationHandler.add( this.playingCallback );

	}

}

THREE.SEA3D.VertexAnimationMesh.prototype.stop = function() {

	this.pause();
	this.time = 0;

}

THREE.SEA3D.VertexAnimationMesh.prototype.clone = function ( object ) {

	return new THREE.SEA3D.VertexAnimationMesh( this.geometry, this.material, this.fps ).copy( this );

};

THREE.SEA3D.prototype.readMesh = function( sea ) {

	var i, count, geo = sea.geometry.tag,
		mesh, mat, skeleton, skeletonAnimation, vertexAnimation, morpher;

	for ( i = 0, count = sea.modifiers ? sea.modifiers.length : 0; i < count; i ++ ) {

		var mod = sea.modifiers[ i ];

		switch ( mod.type )
		{
			case SEA3D.SkeletonLocal.prototype.type:
				skeleton = mod;
				geo.bones = skeleton.tag;
				break;

			case SEA3D.Morph.prototype.type:
				morpher = mod;
				geo.morphAttributes = morpher.tag.attribs;
				geo.morphTargets = morpher.tag.targets;
				break;
		}

	}

	for ( i = 0, count = sea.animations ? sea.animations.length : 0; i < count; i ++ ) {

		var anm = sea.animations[ i ];

		switch ( anm.tag.type )
		{
			case SEA3D.SkeletonAnimation.prototype.type:
				skeletonAnimation = anm.tag;
				geo.animations = this.getSkeletonAnimation( skeletonAnimation, skeleton );
				break;

			case SEA3D.VertexAnimation.prototype.type:
				vertexAnimation = anm.tag;
				geo.morphAttributes = vertexAnimation.tag.attribs;
				geo.morphTargets = vertexAnimation.tag.targets;
				geo.animations = vertexAnimation.tag.animations;
				break;
		}

	}

	var uMorph = morpher != undefined || vertexAnimation != undefined,
		uMorphNormal =
					( morpher && morpher.tag.attribs.normal != undefined ) ||
					( vertexAnimation && vertexAnimation.tag.attribs.normal != undefined );

	if ( sea.material ) {

		if ( sea.material.length > 1 ) {

			var mats = [];

			for ( i = 0; i < sea.material.length; i ++ ) {

				mats[ i ] = sea.material[ i ].tag;
				mats[ i ].skinning = skeleton != undefined;
				mats[ i ].morphTargets = uMorph;
				mats[ i ].morphNormals = uMorphNormal;
				mats[ i ].vertexColors = sea.geometry.color ? THREE.VertexColors : THREE.NoColors;

			}

			mat = new THREE.MultiMaterial( mats );

		} else {

			mat = sea.material[ 0 ].tag;
			mat.skinning = skeleton != undefined;
			mat.morphTargets = uMorph;
			mat.morphNormals = uMorphNormal;
			mat.vertexColors = sea.geometry.color ? THREE.VertexColors : THREE.NoColors;

		}

	}

	if ( skeleton ) {

		mesh = new THREE.SkinnedMesh( geo, mat, false );

		if ( skeletonAnimation ) {

			mesh.setAnimations( geo.animations );

			if ( this.config.autoPlay )
				mesh.play( mesh.animations[ 0 ].name );

		}

	} else if ( vertexAnimation ) {

		mesh = new THREE.SEA3D.VertexAnimationMesh( geo, mat, vertexAnimation.frameRate );

		if ( this.config.autoPlay )
			mesh.play( mesh.animations[ 0 ].name );

	} else {

		mesh = new THREE.Mesh( geo, mat );

	}

	mesh.name = sea.name;

	mesh.castShadow = sea.castShadows;
	mesh.receiveShadow = sea.material ? sea.material[ 0 ].receiveShadows : true;

	this.meshes = this.meshes || [];
	this.meshes.push( this.objects[ "m3d/" + sea.name ] = sea.tag = mesh );

	this.addSceneObject( sea );
	this.updateTransform( mesh, sea );

	this.applyDefaultAnimation( sea, THREE.SEA3D.Object3DAnimator );

}

THREE.SEA3D.prototype.readVertexAnimation = function( sea ) {
	var attribs = {
			position : []
		},
		targets = [],
		animations = [];

	for ( var i = 0, l = sea.frame.length; i < l; i ++ ) {

		var frame = sea.frame[ i ];

		attribs.position[ i ] = new THREE.Float32Attribute( new Float32Array( frame.vertex ), 3 );

		if ( frame.normal ) {

			attribs.normal = attribs.normal || [];
			attribs.normal[ i ] = new THREE.Float32Attribute( new Float32Array( frame.normal ), 3 );

		}

		targets[ i ] = { name: i };

	}

	for ( var i = 0; i < sea.sequence.length; i ++ ) {

		var seq = sea.sequence[ i ];

		animations[ i ] = animations[ seq.name ] = {
			name : seq.name,
			start : seq.start,
			end : seq.start + seq.count,
			repeat : seq.repeat
		}

	}

	sea.tag = {
		attribs : attribs,
		targets : targets,
		animations : animations,
		frameRate : sea.frameRate
	};

}


//*
THREE.SEA3D.prototype.loadBytes = function( data ) {

	// __addVertexAnimation();

	this.file = new SEA3D.File();
	this.file.scope = this;
	this.file.onComplete = this.onComplete;
	this.file.onProgress = this.onLoadProgress;
	this.file.onCompleteObject = this.onCompleteObject;
	this.file.onDownloadProgress = this.onDownloadProgress;
	this.file.onError = this.onError;
	this.file.onHead = this.onHead;

	// SEA3D

	this.file.typeRead[ SEA3D.Geometry.prototype.type ] =
	this.file.typeRead[ SEA3D.GeometryDelta.prototype.type ] = this.readGeometryBuffer;
	this.file.typeRead[ SEA3D.Mesh.prototype.type ] = this.readMesh;
	this.file.typeRead[ SEA3D.Mesh2D.prototype.type ] = this.readMesh2D;
	this.file.typeRead[ SEA3D.Container3D.prototype.type ] = this.readContainer3D;
	this.file.typeRead[ SEA3D.Dummy.prototype.type ] = this.readDummy;
	this.file.typeRead[ SEA3D.Line.prototype.type ] = this.readLine;
	this.file.typeRead[ SEA3D.Material.prototype.type ] = this.readMaterial;
	this.file.typeRead[ SEA3D.PointLight.prototype.type ] = this.readPointLight;
	this.file.typeRead[ SEA3D.DirectionalLight.prototype.type ] = this.readDirectionalLight;
	this.file.typeRead[ SEA3D.HemisphereLight.prototype.type ] = this.readHemisphereLight;
	this.file.typeRead[ SEA3D.Camera.prototype.type ] = this.readCamera;
	this.file.typeRead[ SEA3D.SkeletonLocal.prototype.type ] = this.readSkeletonLocal;
	this.file.typeRead[ SEA3D.JointObject.prototype.type ] = this.readJointObject;
	this.file.typeRead[ SEA3D.CubeMap.prototype.type ] = this.readCubeMap;
	this.file.typeRead[ SEA3D.CubeRender.prototype.type ] = this.readCubeRender;
	this.file.typeRead[ SEA3D.Animation.prototype.type ] = this.readAnimation;
	this.file.typeRead[ SEA3D.SoundPoint.prototype.type ] = this.readSoundPoint;
	this.file.typeRead[ SEA3D.TextureURL.prototype.type ] = this.readTextureURL;
	this.file.typeRead[ SEA3D.Morph.prototype.type ] = this.readMorpher;
	this.file.typeRead[ SEA3D.VertexAnimation.prototype.type ] = this.readVertexAnimation;

	// UNIVERSAL

	this.file.typeRead[ SEA3D.JPEG.prototype.type ] =
	this.file.typeRead[ SEA3D.JPEG_XR.prototype.type ] =
	this.file.typeRead[ SEA3D.PNG.prototype.type ] =
	this.file.typeRead[ SEA3D.GIF.prototype.type ] = this.readImage;
	this.file.typeRead[ SEA3D.MP3.prototype.type ] = this.readSound;
	this.file.typeRead[ SEA3D.GLSL.prototype.type ] = this.readGLSL;
	this.file.typeRead[SEA3D.JavaScript.prototype.type] = this.readJavaScript;
	// this.file.typeRead[SEA3D.JavaScriptMethod.prototype.type] = this.readJavaScriptMethod;

	this.file.read( data );

}


//*/