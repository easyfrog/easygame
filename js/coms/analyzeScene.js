/**
 * analyze sea3d materials with custom stuffix name
 * _metal, _opacity
 */
module.exports = function(game) {
    // get all new loaded materials / meshes
    var mats   = [];
    var meshes = [];
    var dumys  = [];

    var keys = Object.keys(game.sea.objects);

    var i = 0;
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf('mat/') == 0) {             // 材质
            mats.push(game.sea.objects[key]);
        } else if (key.indexOf('m3d/') == 0) {      // 模型
            meshes.push(game.sea.objects[key]);
        } else if (key.indexOf('dmy') == 0) {       // 虚拟物体
            dumys.push(game.sea.objects[key]);
        }
    };

    // 模型 
    for (i = 0; i < meshes.length; i++) {
        var mesh = meshes[i];

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

    // 虚拟体
    for (i = 0; i < dumys.length; i++) {            // 默认将所有的虚拟体,设置为不可见,但可点击.
        var dumy = dumys[i];
        dumy.material.transparent = true;
        dumy.material.opacity = 0;
    };

    // 材质
    for (i = 0; i < mats.length; i++) {
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
        doit(mat, '-nearest', function(o) {             // 贴图禁止 minmap
            o.map.minFilter = THREE.NearestFilter;
            o.map.needsUpdate = true;
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