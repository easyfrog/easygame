require('../../shaders/ConvolutionShader');
require('../../shaders/CopyShader');
require('../../postprocessing/BloomPass');
require('../../postprocessing/ShaderPass');

var game = Game.instance;

module.exports = function( ps ) {
    game.renderer.autoClear = false;

    ps = ps || {};
    var v1 = ps.v1 || 1;
    var v2 = ps.v2 || 25;
    var v3 = ps.v3 || 4;
    var v4 = ps.v4 || 256;

    var effect = new THREE.BloomPass( v1, v2, v3, v4 );

    var copy = new THREE.ShaderPass( THREE.CopyShader );
    copy.renderToScreen = true;

    effect.name = 'bloom';

    return [effect, copy];
};

