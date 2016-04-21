var phongShader = THREE.ShaderLib.phong;

var replaceCode = function( src, target, replace ) {
    var index = src.indexOf( target )
    if (index > -1) {
        src = src.substring( 0, index ) + replace + src.substring( index + target.length );
    }
    return src;
};

var replaceCodeList = function( src, target, replace ) {
    for ( var i = 0; i < target.length; i ++ ) {
        console.log(i);
        src = replaceCode( src, target[ i ], replace[ i ] );
    }
    return src;
};

//*
// support fresnel envMap
var vertexShader = replaceCodeList(phongShader.vertexShader, [
        '#if defined( USE_ENVMAP ) &&',
        '#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP ) && ! defined( PHONG )',
        'vReflect = reflect( cameraToVertex, worldNormal );'
    ], [
        'varying float vReflectionFactor;\nuniform float fresnelBias;\nuniform float fresnelScale;\nuniform float fresnelPower;\nvarying vec3 vReflect;\n#if defined( USE_ENVMAP ) && ',
        '#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP )',
        'vReflect = reflect( cameraToVertex, worldNormal );\n vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( cameraToVertex, worldNormal ), fresnelPower );\n'
        ]);

var fragmentShader = replaceCodeList(phongShader.fragmentShader, [
        'uniform float reflectivity;',
        'outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );',
        'outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );',
        'outgoingLight += envColor.xyz * specularStrength * reflectivity;'
    ], [
        'uniform float reflectivity;\n varying float vReflectionFactor;\n',
        'outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity * vReflectionFactor);\n',
        'outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity * vReflectionFactor);\n',
        'outgoingLight += envColor.xyz * specularStrength * reflectivity * vReflectionFactor;\n'
    ]);
//*/

module.exports = function( ps ) {
    ps = ps || {};
    var fb = ps.fresnelBias || .1;
    var fs = ps.fresnelScale || 1.5;
    var fp = ps.fresnelPower || 3.0;

    var phongMat = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsUtils.clone(phongShader.uniforms), {
                fresnelBias: { type:'f', value: fb },
                fresnelScale: { type:'f', value: fs },
                fresnelPower: { type:'f', value: fp },
            }]),
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        lights: true,
        fog: true,
    });

    phongMat.uniforms.envMap.value = ps.envMap;
    phongMat.uniforms.map.value = ps.map;

    phongMat.defines = {
        USE_MAP: ps.map != undefined,
        USE_ENVMAP: ps.envMap != undefined,
        ENVMAP_TYPE_CUBE: ps.envMap != undefined,
        ENVMAP_MODE_REFLECTION: true,
        ENVMAP_BLENDING_MIX: true,
    }

    return phongMat;
};
