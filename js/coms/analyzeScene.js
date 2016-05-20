/**
 * analyze sea3d objects with custom stuffix name
 * w: width
 * h: height
 * v: value
 */

// get all new loaded materials / meshes
var mats = [], meshes = [], dumys = [];
var lines = [];
var i = 0;

module.exports = function(game, lastOnly) {
    var keys = Object.keys(game.sea.objects);
    if (lastOnly) {                                     // 只针对最后一次导入的内容
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf('m3d/') == 0) {
                meshes.push(game.sea.objects[key]);
            } else if (key.indexOf('dmy/') == 0) {
                dumys.push(game.sea.objects[key]);
            } else if (key.indexOf('mat/') == 0) {
                mats.push(game.sea.objects[key]);
            } else if (key.indexOf('line/') == 0) {
                lines.push(game.sea.objects[key]);
            }
        };
    } else {                                            // 针对所有的物体
        mats   = game.sea.materials || [];
        meshes = game.sea.meshes    || [];
        dumys  = game.sea.dummys    || [];
        lines  = game.sea.lines     || [];
    }

    // 模型 
    analyzeObject(meshes)
    // 材质
    analyzeObject(mats);
    // 线
    analyzeObject(lines);

    // 虚拟体
    for (i = 0; i < dumys.length; i++) {                // 默认将所有的虚拟体,设置为不可见,但可点击.
        var dumy = dumys[i];
        dumy.material.transparent = true;
        dumy.material.opacity = 0;
        dumy.type = 'Dummy';                            // 默认为Mesh, 可能是Bug
        dumy.renderOrder = 100;

        // camera's target do not picked
        if (dumy.name.endsWith('.Target')) {
            dumy.mouseEnabled = false;
        }
    };
    analyzeObject(dumys);

    console.log('-> analyzeScene complete.');
};

// 处理的所有注册方法
var process = {
    'hide': function(o, p) {                            // mesh | dummy
        o.visible = false;
    },
    'transparenthide': function(o, p) {
        if (!o.material) {
            return;
        }
        o.material.transparent = true;
        o.material.opacity = 0; 
        o.renderOrder = 100;
    },
    'notpickable': function(o, p) {
        o.mouseEnabled = false;
    },
    'metal': function(o, p) {                           // mamteral
        o.metal = true;
        o.needsUpdate = true;    
    },
    'opacity': function(o, p) {
        o.transparent = true;
        o.opacity = p['opacity'].v || 0.5;
    },
    'refraction': function(o, p) {
        utils.switchFanSheZheShe(o);
    },
    'nearest': function(o, p) {
        if (!o.map) {return;}
        o.map.minFilter = THREE.NearestFilter;
        o.map.needsUpdate = true;
    },
    'ambient': function(o, p) {                         // emissive

    },
    'line': function(o, p) {                            // line:   -line_v:.2_c:#e86f0b
        var lineMat = o.material;
        if (p.line.v) {                                 // width
            lineMat.lineWidth = parseFloat( p.line.v );
        }
        if (p.line.c) {                                 // color
            lineMat.color = new THREE.Color(p.line.c);
        }
    },
    'layer': function(o, p) {
        if (!Game.instance.layers[p.layer.v]) {
            Game.instance.layers[p.layer.v] = [];
        }
        Game.instance.layers[p.layers.v].push(o);
    }
};

// 分析标签化的名称及参数 
// {name: 'xxx', parameters: {kao: {v: 1}}}
var analyzeName = function( name ) {
    var arr = name.split('-');                          // 'kao-width_w:5.3_h:4.56-hide_v:true'     
    res = {};
    res['parameters'] = {};
    var oldName = name;

    var subArr;
    if (arr.length > 1) {
        for (i = 1; i < arr.length; i++) {              // 'width_w:5.3_h:4.56'
            var ar = arr[i].split('_');
            var type = ar[0];
            res['parameters'][type] = {};

            for (var j = 1; j < ar.length; j++) {       // 'w:5.3' 'h:4.56'
                var p = ar[j].split(':');
                res['parameters'][type][p[0]] = p[1];
            };
        };

        var key = Object.keys(res.parameters)[0];
        if (key in process) {
            res.name = arr[0];                          // 'kao'
        } else {
            res.name = oldName;
        }
    }

    return res;
}

var analyzeObject = function( arr ) {
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        var res = analyzeName(obj.name);

        var types = Object.keys(res.parameters);

        if (types.length == 0) {
            continue;
        }

        obj.name = res.name;

        for (var j = 0; j < types.length; j++) {
            var type = types[j];

            if (process[type]) {
                process[type](obj, res.parameters);
            }
        };
    };
};