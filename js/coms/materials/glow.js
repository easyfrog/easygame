var vertexShader = [
    'uniform vec3 viewVector;',
    'uniform float c;',
    'uniform float p;',
    'varying float intensity;',
    'void main()',
    '{',   
        'vec3 vNormal = normal;',
        'vec3 vNormel = normalize( modelMatrix * vec4(position, 1.0)).xyz - cameraPosition );',   // -- worldPosition
        'intensity = pow( abs(c - dot(vNormal, vNormel)), p );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}'
].join('\n');

var fragmentShader = [
    'uniform vec3 glowColor;',
    'varying float intensity;',
    'void main()',
    '{',
        'vec3 glow = glowColor * intensity;',
        'gl_FragColor = vec4( glow, 1.0 );',
    '}'
].join('\n');

var game = Game.instance;

// c: 0 ~ 1
// p: 0 ~ 6
var glowMaterial = new THREE.ShaderMaterial({
    uniforms: { 
        'c':{ type: "f", value: 0.1 },
        'p':{ type: "f", value: 4.0 },
        'glowColor':{ type: "c", value: new THREE.Color(0xffff00) },
        // 'viewVector': { type: "v3", value: new THREE.Vector3() }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

// var allGlowMats = [];

// set view vector
// game.addEventListener(Game.UPDATE, function() {
//     allGlowMats.forEach(function(itm) {
//         itm.uniforms.viewVector.value = utils.cameraDirection();
//     });
// });

module.exports = function(ps) {
    var res = glowMaterial.clone();
    // allGlowMats.push(res);

    ps = ps || {};
    res.uniforms['c'].value = ps.c || 0;
    res.uniforms['p'].value = ps.p || 4;
    res.uniforms['glowColor'].value = ps.color || new THREE.Color(0xffff00);
    return res;
};