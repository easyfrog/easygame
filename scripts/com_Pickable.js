(function() {
	var com_Pickable = function() {
		this.timeScale = 1;
	};

	com_Pickable.prototype.start = function() {
		var s = this;
		this.object.animation.onComplete = function(anim) {
			s.timeScale = -s.timeScale;
		};
	};

	com_Pickable.prototype.onPicked = function() {
		if (!this.object.animation || this.object.animation.playing) {
			return;
		}
		this.object.animation.timeScale = this.timeScale;
		this.object.animation.play('open');
	};

	com_Pickable.prototype.toOrigin = function() {
		utils.setAnimationTime(this.object.animation, 'open', 0);
		this.timeScale = 1;
	};

	window.com_Pickable = com_Pickable;
}());