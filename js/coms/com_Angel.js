/**
 * Events:
 *     start, update, onMouseDown, onMouseUp, onMouseMove onPicked, onRemove, onKeyDown, onKeyUp
 * properties:
 *        name, enabled, object
 */
var g;
var delta;

/**
 * params:
 *     direction,
 *     horizontalOnly,
 *     friends,
 *     min,
 *     max
 */

function com_Angel(params) {
    this.name = 'com_Angel';
    
    g = Game.instance;
    this.camera = g.camera;

    params.friends = params.friends || [];

    this.friends = [].concat(params.friends);

    this.direction = params.direction;

    this.min = params.min || .75;
    this.max = params.max || .92;

    this.minOpacity = params.minOpacity || 0;

    this.mats = [];

    this.horizontalOnly = params.horizontalOnly;

    if (this.horizontalOnly) {
        this.direction = new THREE.Vector3(this.direction.x, 0, this.direction.z).normalize();
    }
};

// Start
com_Angel.prototype.start = function() {
    console.log(this.name, 'start');
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
    this.friends = this.friends.concat(friends);
    cm(this);
};

// Update
com_Angel.prototype.update = function() {
    var s = this;
    delta = s.max - s.min;
    var dir = utils.cameraDirection(s.camera).normalize();

    if (s.horizontalOnly) {
        dir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
    }

    var v = dir.dot(s.direction);
    var op = 1;
    if (v <= s.min) {
        op = s.minOpacity;                    
    } else if (v >= s.max) {
        op = 1;
    } else {
        op = s.minOpacity + (v - s.min) / delta * ( 1- s.minOpacity );
    }

    utils.setOpacity(s.mats, op);
};

module.exports = com_Angel;
