require('../../shaders/VignetteShader');
require('../../postprocessing/ShaderPass');

module.exports = function( ps ) {
    var shaderVignette = THREE.VignetteShader;
    var effectVignette = new THREE.ShaderPass( shaderVignette );
    // larger values = darker closer to center
    // darkness < 1  => lighter edges
    ps = ps || {};
    effectVignette.uniforms[ "offset" ].value = ps.offset || 1.5;
    effectVignette.uniforms[ "darkness" ].value = ps.darkness || 1;
    effectVignette.renderToScreen = true;

    return effectVignette;
};