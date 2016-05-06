require('../../shaders/SMAAShader');
require('../../postprocessing/SMAAPass');

module.exports = function( ps ) {
    ps = ps || {};

    var effect = new THREE.SMAAPass(Game.instance.width, Game.instance.height);
    effect.renderToScreen = true;

    effect.name = 'smaa';

    return effect;
};

