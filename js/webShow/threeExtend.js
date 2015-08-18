
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
