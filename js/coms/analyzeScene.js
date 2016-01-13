/**
 * analyze sea3d materials with custom stuffix name
 * _metal, _opacity
 */
module.exports = function(game) {
    // get all new loaded materials / meshes
    var mats = [];
    var meshes = [];

    var keys = Object.keys(game.sea.objects);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf('mat/') == 0) {
            mats.push(game.sea.objects[key]);
        } else if (key.indexOf('m3d/') == 0) {
            meshes.push(game.sea.objects[key]);
        }
    };

    // analyze meshes name 
    for (var j = 0; j < meshes.length; j++) {
        var mesh = meshes[j];

        doit(mesh, '-hide', function(o) {               // 隐藏, 同时隐藏子物体
            o.visible = false;
        });
        doit(mesh, '-transparenthide', function(o) {    // 使用材质的transparent,opacity方式隐藏,不影响子物体,并可点击
            o.material.transparent = true;
            o.material.opacity = 0;
        });
        doit(mesh, '-notpickable', function(o) {        // 使物体不接收点击
            o.mouseEnabled = false;
        });
    };

    // analyze material name
    for (var i = 0; i < mats.length; i++) {
        var mat = mats[i];

        doit(mat, '-metal', function(o) {               // 金属
            o.metal = true;
            o.needsUpdate = true;
        });
        doit(mat, '-opacity', function(o) {             // 透明
            o.transparent = true;
        });
        doit(mat, '-refraction', function(o) {          // 折射      
            utils.switchFanSheZheShe(o);
        });
    };

    console.log('analyzeScene complete.');
};

var doit = function( obj, symbol, action ) {
    if (obj.name.indexOf(symbol) > 0) {
        action(obj);
        obj.name = obj.name.replace(symbol, '');
    }
}