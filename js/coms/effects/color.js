require('../../shaders/ColorCorrectionShader');
require('../../postprocessing/ShaderPass');

module.exports = function( ps ) {
    var effect = new THREE.ShaderPass( THREE.ColorCorrectionShader );
    effect.renderToScreen = true;

    ps = ps || {};
    effect.uniforms.powRGB = ps.pwoRGB || new THREE.Vector3(2, 2, 2);
    effect.uniforms.mulRGB = ps.pwoRGB || new THREE.Vector3(1, 1, 1);
    effect.uniforms.addRGB = ps.pwoRGB || new THREE.Vector3(0, 0, 0);

    effect.name = 'color';

    return effect;
};