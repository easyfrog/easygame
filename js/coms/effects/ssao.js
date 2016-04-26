require('../../shaders/SSAOShader');
require('../../postprocessing/ShaderPass');

var game = Game.instance;

module.exports = function( ps ) {
    ps = ps || {};
    var depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.depthPacking = THREE.RGBADepthPacking;
    depthMaterial.blending = THREE.NoBlending;
    
    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    var depthRenderTarget = new THREE.WebGLRenderTarget( game.width, game.height, pars );

    // Setup SSAO pass
    var ssaoPass = new THREE.ShaderPass( THREE.SSAOShader );
    ssaoPass.renderToScreen = true;
    //ssaoPass.uniforms[ "tDiffuse" ].value will be set by ShaderPass
    ssaoPass.uniforms[ "tDepth" ].value = depthRenderTarget;
    ssaoPass.uniforms[ 'size' ].value.set( game.width, game.height );
    ssaoPass.uniforms[ 'cameraNear' ].value = game.camera.near;
    ssaoPass.uniforms[ 'cameraFar' ].value = game.camera.far;
    ssaoPass.uniforms[ 'onlyAO' ].value = false;
    ssaoPass.uniforms[ 'aoClamp' ].value = ps.aoClamp || 0.5;
    ssaoPass.uniforms[ 'lumInfluence' ].value = ps.lumInfluence || 0.4;

    ssaoPass.name = 'ssao';

    // set preRender
    ssaoPass.preRender = function() {
        game.scene.overrideMaterial = depthMaterial;
        game.renderer.render( game.scene, game.camera, depthRenderTarget, true );
        game.scene.overrideMaterial = null;
    };

    return ssaoPass;
};
