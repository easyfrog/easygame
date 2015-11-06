/*THREE.SEA3D.Object3DAnimator.prototype.setRelative = function( val ) {
	if (this.object3d.setAnimateMatrix) {
		this.object3d.setAnimateMatrix( this.relative = val );
	}
}*/

/**
 * MorphAnimation update function
 * 解决了开始播放时跳的问题
 */
//*
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
//*/

/**
 * SEAD.AnimationHandler
 */
//*
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

SEA3D.AnimationHandler.prototype.playWithTimescale = function( name, timeScale, crossfade, offset ) {
	this.currentState = this.getStateByName( name );
	if ( ! this.currentState )
		throw new Error( 'Animation "' + name + '" not found.' );

	this.timeScale = timeScale || 1;
	this.play(name, crossfade, offset);
};

THREE.TextureAnimator = function (texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {	
	// note: texture passed by reference, will be updated by the update function.
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet. 
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	// how long should each image be displayed?
	this.tileDisplayDuration = tileDispDuration;

	// how long has the current image been displayed?
	this.currentDisplayTime = 0;

	// which image is currently being displayed?
	this.currentTile = 0;
		
	this.update = function( milliSec )
	{
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
		{
			this.currentDisplayTime -= this.tileDisplayDuration;
			this.currentTile++;
			if (this.currentTile == this.numberOfTiles)
				this.currentTile = 0;
			var currentColumn = this.currentTile % this.tilesHorizontal;
			texture.offset.x = currentColumn / this.tilesHorizontal;
			var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
			texture.offset.y = currentRow / this.tilesVertical;
		}
	};
};		

/**
 * add time scale feature to vertex animation mesh
 */
THREE.SEA3D.VertexAnimationMesh.prototype.play = function( name, offset, timescale) {
	timescale = timescale || 1;

	var animation = this.animations[ name ];

	this.setFrameRange( animation.start ? animation.start : 1, animation.end - 1 );

	this.duration = ( animation.end - animation.start ) / this.fps / timescale;
	this.time = offset !== undefined ? offset : this.time;

	this.resume();

};
