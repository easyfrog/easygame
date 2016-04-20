//
// Effect Composer Render
// 
// Example:
//          glo.effectRender = require('../../js/coms/effectRender').create();  // create a composer manager
//          var sepiaEffect = require('../../js/coms/effects/sepia');           // require some effects
//          glo.effectRender.addPass(sepiaEffect);                              // add effect to composer manager
//          glo.effectRender.start();                                           // render by this composer

var game = Game.instance;

// use mudules
require('../shaders/CopyShader');
require('../postprocessing/ShaderPass');
require('../postprocessing/MaskPass');
require('../postprocessing/EffectComposer');
require('../postprocessing/RenderPass');

var effectRender = function( ps ) {
    this.name = 'effectRender';
    // composer
    this.composer = new THREE.EffectComposer(game.renderer);
    this.composer.setSize(game.width, game.height);

    // add base render pass
    this.composer.addPass(new THREE.RenderPass(game.scene, game.camera));
};

effectRender.prototype.render = function(delta) {
    this.composer.render(delta);
};

effectRender.prototype.start = function() {
    game.custormRenderFunction = this.render.bind(this);
};

effectRender.prototype.stop = function() {
    game.custormRenderFunction = null;
};

effectRender.prototype.setSize = function(w, h) {
    this.composer.setSize(w, h);
};

effectRender.prototype.addPass = function(pass, lastRTS) {
    var s = this;
    pass = [].concat(pass); // maybe multi passes

    if (lastRTS == undefined) {
        lastRTS = false;
    }

    pass.forEach(function(itm) {
        if (itm instanceof Array) {
            s.addPass(itm, lastRTS);
        } else {
            var len = s.composer.passes.length;
            if ( len > 0 && 'renderToScreen' in s.composer.passes[len - 1] ) {
                s.composer.passes[len - 1].renderToScreen = lastRTS;
            }
            s.composer.addPass(itm);
        }
    });
};

effectRender.prototype.removePass = function(pass) {
    var index = this.composer.passes.indexOf(pass);
    if (index > -1) {
        this.composer.passes.splice(index, 1);           
    }
};

effectRender.prototype.setEffect = function(index, pass) {
    this.composer.passes[index] = pass;
};

effectRender.prototype.getEffect = function(name) {
    for (var i = 0; i < this.composer.passes.length; i++) {
        var itm = this.composer.passes[i];
        if (itm.name == name) {
            return {
                effect: itm,
                index: i
            };
        }
    }
};

// set game's custorm render function
module.exports = function( ps ) {
    return new effectRender( ps );
};

