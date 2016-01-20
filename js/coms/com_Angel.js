/**
 * Events:
 *     start, update, onMouseDown, onMouseUp, onMouseMove onPicked, onRemove, onKeyDown, onKeyUp
 * properties:
 *        name, enabled, object
 */
var g;
var delta;

function com_Angel(params) {
    this.name = 'com_Angel';
    
    g = Game.instance;
    this.camera = g.camera;
    this.friends = [].concat(params);

    this.direction;

    this.min = .75;
    this.max = .92;

    this.isOnOff = false;
    this.mats = [];
};

// Start
com_Angel.prototype.start = function() {
    this.direction = utils.cameraDirection(this.camera);

    // collect materials
    cm(this);
};

var cm = function(f) {
    f.mats = utils.collectMaterials(f.object);
    for (var i = 0; i < f.friends.length; i++) {
        var o = f.friends[i];
        f.mats = f.mats.concat(utils.collectMaterials(o));
    };
}

com_Angel.prototype.addFriends = function(friends) {
    this.friends.concat(friends);
    cm(this);
};

// Update
com_Angel.prototype.update = function() {
    var s = this;
    delta = s.max - s.min;
    var dir = utils.cameraDirection(s.camera);

    var v = dir.dot(s.direction);
    var op = 1;
    if (v <= s.min) {
        op = 0;                    
    } else if (v >= s.max) {
        op = 1;
    } else {
        op = (v - s.min) / delta;
    }

    utils.setOpacity(s.mats, op);
};

module.exports = com_Angel;