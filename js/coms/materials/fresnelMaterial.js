var shader = {
    uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'], {
        color: {type: 'c', value: new THREE.Color(0x555588)},
        specular: {type: 'c', value: new THREE.Color(0xFFFFFF)},
        fresnelColor: {type: 'c', value: new THREE.Color(0xdddddd)},
        map: {type: 't', value: null},
        cube: {type: 't', value: null},
        opacityType: {type: 'i', value: 0},  // 0, 1, 2
        fresnelBias: {type: 'f', value: 0.1},
        fresnelScale: {type: 'f', value: 1.0},
        fresnelPower: {type: 'f', value: 2.0},
        specularC: {type: 'f', value: 1.0},
        specularP: {type: 'f', value: 20.0}
    }]),

    vertexShader: [
        'uniform float fresnelBias;',
        'uniform float fresnelScale;',
        'uniform float fresnelPower;',

        'varying vec2 vUv;',
        'varying vec3 vReflect;',
        'varying float vReflectionFactor;',
        'varying vec4 worldPosition;',
        'varying vec3 worldNormal;',

        'void main() {',
            'vUv = uv;',
            'worldPosition = modelMatrix * vec4( position, 1.0 );',
            'worldNormal = normalize ( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );',

            'vec3 I = worldPosition.xyz - cameraPosition;',
            'vReflect = reflect( I, worldNormal );',
            'vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );',

            'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
    ].join('\n'),

    fragmentShader: [
        'uniform vec3 color;',
        'uniform vec3 fresnelColor;',
        'uniform vec3 specular;',
        'uniform sampler2D map;',
        'uniform samplerCube cube;',
        'uniform int opacityType;',
        'uniform float specularC;',
        'uniform float specularP;',

        'varying vec2 vUv;',
        'varying vec3 vReflect;',
        'varying float vReflectionFactor;',
        'varying vec4 worldPosition;',
        'varying vec3 worldNormal;',

        'uniform vec3 pointLightColor[MAX_POINT_LIGHTS];',
        'uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];',
        'uniform float pointLightDistance[MAX_POINT_LIGHTS];',

        'void main() {',
            'vec4 _col = vec4(color, 1.0);',

            '#ifdef USE_MAP',
                '_col = texture2D( map, vUv );',
            '#endif',

            'vec4 reflectColor = vec4(fresnelColor, 1.0);',
            '#ifdef USE_CUBE',
                'reflectColor = textureCube( cube, vec3( -vReflect.x, vReflect.yz ) );',
            '#endif',

            'vec4 addedLights = vec4(0.0,0.0,0.0, 1.0);',

            'float specularAmount = 0.0;',
            'for(int l = 0; l < MAX_POINT_LIGHTS; l++) {',
                'vec3 lightDirection = normalize(worldPosition.xyz - pointLightPosition[l]);',
                'addedLights.rgb += clamp(dot(-lightDirection, worldNormal), 0.0, 1.0) * pointLightColor[l];',
                'specularAmount += pow(specularC * dot(normalize(worldNormal), lightDirection), specularP);',
            '}',

            'float opacity = 1.0;',
            'float tmp = clamp( vReflectionFactor, 0.0, 1.0 );',
            'if (opacityType == 0) {',
                'opacity = 1.0;',
            '} else if (opacityType == 1) {',
                'opacity = tmp;',
            '} else {',
                'opacity = 1.0 - tmp;',
            '}',

            'vec4 _tmpCol = mix(_col * addedLights, vec4(specular, 1.0), specularAmount);',
            'gl_FragColor = vec4(mix(_tmpCol, reflectColor, tmp).rgb, opacity);',
        '}'
    ].join('\n')
};

module.exports = function( ps ) {
    ps = ps || {};
    var uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    uniforms.map.value = ps.map;
    uniforms.cube.value = ps.cube;
    uniforms.fresnelBias.value = ps.bias || 0.1;
    uniforms.fresnelScale.value = ps.scale || 1.5;
    uniforms.fresnelPower.value = ps.power || 2.0;
    if (ps.opacityType == undefined) {
        ps.opacityType = 0;     // 0: no opacity, 1: fresnel opacity 2: inverse
    }
    uniforms.opacityType.value = ps.opacityType;
    uniforms.fresnelColor.value = ps.fresnelColor || new THREE.Color(0xdddddd);
    uniforms.specular.value = ps.specular || new THREE.Color(0xFFFFFF);

    var mat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
        lights: true,
        transparent: true
    });

    // defines
    mat.defines = {
        USE_MAP: ps.map != undefined,
        USE_CUBE: ps.cube != undefined
    }

    return mat;
};