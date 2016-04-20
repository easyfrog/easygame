require('../../shaders/HueSaturationShader');
require('../../postprocessing/ShaderPass');

module.exports = function( ps ) {
    var effect = new THREE.ShaderPass( THREE.HueSaturationShader );

    ps = ps || {};
    effect.uniforms.hue.value = ps.hue || 0;
    effect.uniforms.saturation.value = ps.saturation || 0;

    effect.renderToScreen = true;
    effect.name = 'hue';

    return effect;
};