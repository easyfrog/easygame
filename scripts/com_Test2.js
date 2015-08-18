(function() {
	var com_Test2 = function() {
		
	};

	com_Test2.prototype.onMouseDown = function(e) {
		this.object.scale.y = 2;
	};

	com_Test2.prototype.onMouseUp = function(e) {
		this.object.scale.y = 1;
	};

	com_Test2.prototype.update = function() {
		this.object.rotation.y = Game.instance.getTime();
	};

	com_Test2.prototype.onPicked = function(e) {
		console.log('picked ' + this.object.name);
	};


	window.com_Test2 = com_Test2;
}());	