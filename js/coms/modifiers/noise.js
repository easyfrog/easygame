
/**
 * Noise animate modifier
 * write by ztc at 2016/05/16
 * parameters:
 *     mesh,
 *     x,
 *     y,
 *     z,
 *     speedMin,
 *     speedMax,
 *     xMin,
 *     yMin,
 *     zMin
 */
var Noise = function( ps ) {
    if (!ps.mesh) {return;}

    this.noise = [];
    this.mesh = ps.mesh;

    ps.x = ps.x == undefined ? 0 : ps.x;
    ps.y = ps.y == undefined ? 0 : ps.y;
    ps.z = ps.z == undefined ? 0 : ps.z;

    ps.speedMin = ps.speedMin || 0;
    ps.speedMax = ps.speedMax || 1;

    // buffer geometry to Normal Geometry to use mergeVertices function
    if (ps.mesh.geometry.type.indexOf('BufferGeometry') > -1) {
        ps.mesh.geometry = new THREE.Geometry().fromBufferGeometry(ps.mesh.geometry);
    }

    ps.mesh.geometry.mergeVertices();

    var vs = ps.mesh.geometry.vertices;
    this.vs = vs;
    for (var i = 0; i < vs.length; i++) {
        var _x = Math.random() * ps.x * 2 - ps.x;
        var _y = Math.random() * ps.y * 2 - ps.y;
        var _z = Math.random() * ps.z * 2 - ps.z;

        if (ps.xMin) {_x = clamp(_x, ps.xmin);}
        if (ps.yMin) {_y = clamp(_y, ps.ymin);}
        if (ps.zMin) {_z = clamp(_z, ps.zmin);}

        this.noise.push({
            x: vs[i].x,
            y: vs[i].y,
            z: vs[i].z,
            ang: Math.random() * Math.PI * 2,
            amx: _x,
            amy: _y,
            amz: _z,
            speed: ps.speed == undefined ? ps.speedMin + Math.random() * (ps.speedMax - ps.speedMin) : ps.speed
        });
    }

    ps.flatShading = ps.flatShading == undefined ? true : ps.flatShading;

    // flat shading
    if (ps.flatShading) {
        this.mesh.material.shading = THREE.FlatShading
        this.mesh.material.needsUpdates = true;
    }

    this.updateCallback = this.update.bind(this);
    Game.instance.addEventListener(Game.UPDATE, this.updateCallback);
};

function clamp(v, min) {
    if (v >= 0 && v <= min) {return min;}
    if (v < 0 && v >= -min) {return -min;}
    return v;
}

Noise.prototype.update = function() {
    for (var i = 0; i < this.noise.length; i++) {
        var prop = this.noise[i];
        this.vs[i].x = prop.x + Math.cos(prop.ang) * prop.amx;
        this.vs[i].y = prop.y + Math.cos(prop.ang) * prop.amy;
        this.vs[i].z = prop.z + Math.cos(prop.ang) * prop.amz;

        prop.ang += prop.speed * Game.instance.getDeltaTime();

        this.mesh.geometry.verticesNeedUpdate = true;
    }
};

module.exports = Noise;