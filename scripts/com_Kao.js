(function() {
	var com_Kao = function() {
		
	};

	com_Kao.prototype.start = function() {
		console.log('--->' + this.object.name + ' is start');
	};

	com_Kao.prototype.update = function() {
		this.object.rotation.y = Game.instance.getTime();
		this.object.scale.x = Math.sin(Game.instance.getTime() + 2);
	};

	com_Kao.prototype.onMouseDown = function(e) {
		this.object.visible = false;
	};

	com_Kao.prototype.onMouseUp = function(e) {
		this.object.visible = true;
	};

	com_Kao.prototype.onRemove = function() {
		console.log('-----> ' + this.object.name + ' is Destoryed');
	};

	window.com_Kao = com_Kao;
}());	