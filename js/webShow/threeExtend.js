
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

