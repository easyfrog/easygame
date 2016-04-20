require('../../shaders/HorizontalBlurShader');
require('../../shaders/VerticalBlurShader');
require('../../postprocessing/ShaderPass');

var game = Game.instance;

module.exports = function( ps ) {
    var effectHorizBlur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
    var effectVertiBlur = new THREE.ShaderPass( THREE.VerticalBlurShader );

    ps = ps || {};
    var blurH = ps.blurH || 1;
    var blurV = ps.blurV || 1;

    effectHorizBlur.uniforms[ "h" ].value = blurH / game.width;
    effectVertiBlur.uniforms[ "v" ].value = blurV / game.height;
    
    effectVertiBlur.renderToScreen = true;

    effectHorizBlur.name = 'blurH';
    effectVertiBlur.name = 'blurV';

    return [effectHorizBlur, effectVertiBlur];
};