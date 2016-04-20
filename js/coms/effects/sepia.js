require('../../shaders/SepiaShader');
require('../../postprocessing/ShaderPass');

module.exports = function( ps ) {
    var effect = THREE.SepiaShader;
    var effect = new THREE.ShaderPass( effect );

    ps = ps || {};

    effect.uniforms[ "amount" ].value =  ps.amount || 1;
    effect.renderToScreen = true;

    effect.name = 'sepia';
    return effect;
};
