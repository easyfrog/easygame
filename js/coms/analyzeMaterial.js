/**
 * analyze sea3d materials with custom stuffix name
 * _metal, _opacity
 */
module.exports = function(game) {
    // 1. get all new loaded materials
    var mats = [];
    var keys = Object.keys(game.sea.objects);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf('mat/') == 0) {
            mats.push(game.sea.objects[key]);
        }
    };

    // analyze
    for (var i = 0; i < mats.length; i++) {
        var mat = mats[i];
        if (mat.name.endsWith('_metal')) {          // 金属
            mat.metal = true;
            mat.needsUpdate = true;
        } else if (mat.name.endsWith('_opacity')) {  // 透明
            mat.transparent = true;
        }
    };
};