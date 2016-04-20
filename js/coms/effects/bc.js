require('../../shaders/BrightnessContrastShader');
require('../../postprocessing/ShaderPass');

module.exports = function( ps ) {
    var effect = new THREE.ShaderPass( THREE.BrightnessContrastShader );
    
    ps = ps || {};
    effect.uniforms[ "brightness" ].value = ps.brightness || .05;
    effect.uniforms[ "contrast" ].value = ps.contrast || .15;
    effect.renderToScreen = true;
    effect.name = 'bc';

    return effect;
};
