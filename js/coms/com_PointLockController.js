(function() {
	var com_PointLockController = function(params) {
		this.enabled = true;
		this.fade = 0.9;
		this.fading = false;
		this.threshold = 0.01;
		this.movement = new THREE.Vector2();
	};

	com_PointLockController.prototype.setRotation = function() {
		this.object.rotation.x -= this.movement.y * 0.002;
		this.object.rotation.y -= this.movement.x * 0.002;
	};

	com_PointLockController.prototype.start = function() {
		var s = this;
		game.addEventListener(Game.MOUSEMOVE, function(e) {
			if (game.isMouseDown && s.enabled) {
				s.movement = game.mouseMovement;
				s.setRotation();
			}
		});

		game.addEventListener(Game.MOUSEDOWN, function() {
			s.fading = false;
		});

		game.addEventListener(Game.MOUSEUP, function() {
			s.movement = game.mouseMovement;
			s.fading = true;
		});

		game.addEventListener(Game.UPDATE, function() {
			if (s.enabled && s.fading && (Math.abs(s.movement.x) >s.threshold || Math.abs(s.movement.y) > s.threshold)) {
				s.movement.x *= s.fade;
				s.movement.y *= s.fade;
				s.setRotation();
				if (Math.abs(s.movement.x) < s.threshold) {
					s.movement.x = 0;
				}
				if (Math.abs(s.movement.y) < s.threshold) {
					s.movement.y = 0;
				}
			}
		});
	};

	window.com_PointLockController = com_PointLockController;
}());