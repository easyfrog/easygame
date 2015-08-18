/**
 * Created by easyfrog on 2014/7/22.
 */

// Main NameSpace
//var ztc = {};
var ztc = ztc || {};

// Tween NameSpace
ztc.Tween = {};

ztc.Tween.currentTime = 0;
ztc.Tween.lastTime = 0;

// 是否为Dom模式
ztc.Tween.isDom = true;

ztc.Tween.easeInOutQuad = function(val) {
    val /= 0.5;
    var sta = 0;
    var end = 1;
    if (val < 1) return end / 2 * val * val + sta;
    val--;
    return -end / 2 * (val * (val - 2) - 1) + sta;
};

ztc.Tween.easeInQuad = function(val) {
    var sta = 0;
    var end = 1;
    return end * val * val + sta;
};

ztc.Tween.easeOutQuad = function(val) {
    var sta = 0;
    var end = 1;
    return -end * val * (val - 2) + sta;
};

ztc.Tween.linear = function(val) {
    return val;
};

ztc.Tween.berp = function(val) {
    if(val < 0) val = 0;
    if(val > 1) val = 1;

    val = (Math.sin(val * Math.PI * (0.2 + 2.5 * val * val * val)) * Math.pow(1 - val, 2.2) + val) * (1 + (1.2 * (1 - val)));
    return val;
};

ztc.Tween.hermite = function(val) {
    return val * val * (3.0 - 2.0 * val);
};

ztc.Tween.sinerp = function(val) {
    return Math.sin(val * Math.PI * 0.5);
};

ztc.Tween.coserp = function(val) {
    return 1.0 - Math.cos(val * Math.PI * 0.5);
};

// easeInBack
ztc.Tween.easeInBack = function(val) {
    return val * val * ((1.70158 + 1.0) * val - 1.70158);
}

// easeOutBack
ztc.Tween.easeOutBack = function(val) {
    var v = val - 1.0;
    return v * v * ((1.70158 + 1) * v + 1.70158) + 1.0;
}

// easeInOutBack
ztc.Tween.easeInOutBack = function(val) {
    var v = 2.0 * val;
    var s = 1.70158 * 1.525;
    if (v < 1.0) {
        return 0.5 * (v * v * ((s + 1.0) * v - s));
    }
    v -= 2.0;
    return 0.5 * (v * v * ((s + 1.0) * v + s) + 2.0);
}

ztc.Tween.kill = function(id) {
    clearInterval(id);
};

ztc.Tween.getStyle = function(obj,name) {
    if(obj.currentStyle) {
        return obj.currentStyle[name];
    } else {
        return getComputedStyle(obj,false)[name];
    }
};

ztc.Tween.fadeTo = function(time,todo,cvFunc,over,update) {
    if(cvFunc == null) cvFunc = ztc.Tween.linear;

    var val = 0;
    var rate;
    var intervalID = 0;

    if(time == 0) {
        todo(1);
        if (update != undefined) { update(1); };
        // invoke complete function
        if(over != undefined) over();
    } else {
        ztc.Tween.lastTime = Date.now();

        intervalID = setInterval(function() {
            ztc.Tween.currentTime = Date.now();
            val += (ztc.Tween.currentTime - ztc.Tween.lastTime) / 1000;
            ztc.Tween.lastTime = ztc.Tween.currentTime;

            if(val >= time) val = time;
            rate = val / time;
            // invoke todo function
            var _v = cvFunc(rate);
            todo(_v);
            // invoke update function
            if(update != undefined) update(_v);
            if(rate == 1) {
                // clear interval function
                clearInterval(intervalID);
                // invoke complete function
                if(over != null) over();
            }
        },1);
    }

    return intervalID;
};

ztc.Tween.action = function(target,time,attr,cvFunc,over,update) {
    var oldArray = [];
    if (ztc.Tween.isDom) {
        for(var i in attr) {
            var v = parseFloat(ztc.Tween.getStyle(target,i));
            if(i == "opacity") v *= 100;
            oldArray.push({prop:i,old:v,delta:attr[i] - v});
        }

        var _id = ztc.Tween.fadeTo(time,function(f) {
            for(var i = 0;i < oldArray.length;i++) {
                if (oldArray[i].prop == "opacity") {
                    target.style.filter = 'alpha:opacity('+ (oldArray[i].old + f * oldArray[i].delta) +')';
                    target.style.opacity = (oldArray[i].old + f * oldArray[i].delta) / 100;
                } else {
                    target.style[oldArray[i].prop] = oldArray[i].old + f * oldArray[i].delta + 'px';
                }
            }
        },cvFunc,over,update);
    } else {
        for(var i in attr) {
            oldArray.push({prop:i,old:target[i],delta:(attr[i] - target[i])});
        }
        
        // 动作
        var _id = ztc.Tween.fadeTo(time,function(f) {
            for(var i = 0;i < oldArray.length;i ++ ) {
                target[oldArray[i].prop] = oldArray[i].old + f * oldArray[i].delta;
            } 
        },cvFunc,over,update);
    }

    return _id;
};

ztc.Tween.actionArray = function(targets,time,attr,cvFunc,over,update) {
    var oldArray = [];
    if (ztc.Tween.isDom) {
        for (var tar in targets) {
            for(var i in attr) {
                var v = parseFloat(ztc.Tween.getStyle(targets[tar], i));
                if (i == "opacity") v *= 100;
                oldArray.push({obj:targets[tar],prop: i, old: v, delta: attr[i] - v});
            }
        }

        var _id = ztc.Tween.fadeTo(time,function(f) {
            for(var i = 0;i < oldArray.length;i++) {
                var item = oldArray[i];
                if (item.prop == "opacity") {
                    item.obj.style.filter = 'alpha:opacity('+ (item.old + f * item.delta) +')';
                    item.obj.style.opacity = (item.old + f * item.delta) / 100;
                } else {
                    item.obj.style[item.prop] = item.old + f * item.delta + 'px';
                }
            }
        },cvFunc,over,update);
    } else {
        for(var i in attr) {
            for (var target in targets) {
                oldArray.push({obj:target,prop:i,old:target[i],delta:(attr[i] - target[i])});
            }
        }
        
        var _id = ztc.Tween.fadeTo(time,function(f) {
            for(var i = 0;i < oldArray.length;i++) {
                var item = oldArray[i];
                item.obj[item.prop] = item.old + f * item.delta;
            }
        },cvFunc,over,update);
    }

    return _id;
};

ztc.Tween.actionArrayProps = function(targets,time,attrs,cvFunc,over,update) {
    var all = [];

    if (ztc.Tween.isDom) {
        for (var tar in targets) {
            var oldArray = [];
            for(var i in attrs[tar]) {
                var v = parseFloat(ztc.Tween.getStyle(targets[tar], i));
                if (i == "opacity") v *= 100;
                oldArray.push({prop: i, old: v, delta: attrs[tar][i] - v});
            }
            all.push(oldArray);
        }

        var _id = ztc.Tween.fadeTo(time,function(f) {
            for(var tar = 0;tar < targets.length; tar ++) {
                var item = targets[tar];
                var oldVals = all[tar];
                for (var v in oldVals) {
                    if (oldVals[v].prop == "opacity") {
                        item.style.filter = 'alpha:opacity(' + (oldVals[v].old + f * oldVals[v].delta) + ')';
                        item.style.opacity = (oldVals[v].old + f * oldVals[v].delta) / 100;
                    } else {
                        item.style[oldVals[v].prop] = oldVals[v].old + f * oldVals[v].delta + 'px';
                    }
                }
            }
        },cvFunc,over,update);
    } else {
        for(var i in targets) {
            var oldValue = [];
            for(var j in attrs[i]) {
                oldValue.push({prop:j,old:targets[i][j],delta:(attrs[i][j] - targets[i][j])});
            }
            all.push(oldValue);
        }
        
        var _id = ztc.Tween.fadeTo(time,function(f) {
            for(var i in targets) {
                for(var j in all[i]) {
                    targets[i][all[i][j].prop] = all[i][j].old + f * all[i][j].delta;
                }
            }
        },cvFunc,over,update);
    }

    return _id;
};

