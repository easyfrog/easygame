// Custom shader 
// support fresnel and mask
THREE.ShaderLib[ 'mirror' ] = {
    uniforms: {
        "mirrorColor": { type: "c", value: new THREE.Color(0x7F7F7F) },
        "map": { type: "t", value: null },
        "mask": { type: "t", value: null },
        "mirrorSampler": { type: "t", value: null },
        "textureMatrix" : { type: "m4", value: new THREE.Matrix4() },

        'fresnelBias': {type: 'f', value: 0.1},
        'fresnelScale': {type: 'f', value: 1.0},
        'fresnelPower': {type: 'f', value: 2.0},
        'min': {type: 'f', value: 0.1},
        'max': {type: 'f', value: 0.9},
        'brightness': {type: 'f', value: 1},
    },

    vertexShader: [
        "uniform mat4 textureMatrix;",
        "varying vec4 mirrorCoord;",
        "varying vec2 vUv;",
        "varying vec3 vNormal;",
        "varying vec3 eyeVec;",

        'uniform float fresnelBias;',
        'uniform float fresnelScale;',
        'uniform float fresnelPower;',

        'varying float vReflectionFactor;',
        'varying vec4 worldPosition;',
        'varying vec3 worldNormal;',
    
        "void main() {",
            "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
            "worldPosition = modelMatrix * vec4( position, 1.0 );",
            'worldNormal = normalize ( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );',

            "vUv = uv;",

            'vec3 I = worldPosition.xyz - cameraPosition;',
            'vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );',

            "mirrorCoord = textureMatrix * worldPosition;",
            "eyeVec = -mvPosition.xyz;",
            "vNormal = normalize(normalMatrix * normal);",
            "gl_Position = projectionMatrix * mvPosition;",

        "}"

    ].join("\n"),

    fragmentShader: [
        "uniform vec3 mirrorColor;",
        "uniform sampler2D map;",
        "uniform sampler2D mirrorSampler;",
        "uniform sampler2D mask;",
        'uniform float min;',
        'uniform float max;',
        'uniform float brightness;',

        "varying vec4 mirrorCoord;",
        "varying vec2 vUv;",
        "varying vec3 vNormal;",
        "varying vec3 eyeVec;",

        'varying float vReflectionFactor;',
        'varying vec4 worldPosition;',
        'varying vec3 worldNormal;',

        "float blendOverlay(float base, float blend) {",
            "return( base < 0.5 ? ( 2.0 * base * blend ) : (1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );",
        "}",
        
        "void main() {",
            "vec4 maskColor = vec4(1.0);",

            '#ifdef USE_MASK',
                "maskColor = texture2D(mask, vUv);",
            '#endif',

            "vec4 color = vec4(1.0);",

            '#ifdef USE_MAP',
                "color = texture2D(map, vUv);",
            "#endif",

            "vec4 mColor = texture2DProj(mirrorSampler, mirrorCoord);",

            "mColor = vec4(blendOverlay(mirrorColor.r, mColor.r), blendOverlay(mirrorColor.g, mColor.g), blendOverlay(mirrorColor.b, mColor.b), 1.0);",

            '#ifdef USE_MASK',
                'mColor = mColor * maskColor;',
            '#endif',

            // "color = mix(mColor, color, clamp(dot(vNormal, normalize(eyeVec)/2.0+0.4), 0.4, 0.9));",
            "color = mix(color, mColor, clamp(vReflectionFactor, min, max));",
            // "gl_FragColor = color * vec4(brightness,brightness,brightness, 1.0);",
            "gl_FragColor = vec4(color.r * brightness, color.g * brightness, color.b * brightness, 1.0);",
        "}"

    ].join("\n")
};

THREE.Mirror = function ( renderer, camera, options ) {

    THREE.Object3D.call( this );

    this.name = 'mirror_' + this.id;

    options = options || {};

    this.matrixNeedsUpdate = true;

    var width = options.textureWidth !== undefined ? options.textureWidth : Game.instance ? Game.instance.width : 512;
    var height = options.textureHeight !== undefined ? options.textureHeight : Game.instance ? Game.instance.height : 512;

    this.clipBias = options.clipBias !== undefined ? options.clipBias : 0.003;

    var mirrorColor = options.color !== undefined ? new THREE.Color( options.color ) : new THREE.Color( 0x7F7F7F );

    this.renderer = renderer;
    this.mirrorPlane = new THREE.Plane();
    this.normal = new THREE.Vector3( 0, 0, 1 );
    this.mirrorWorldPosition = new THREE.Vector3();
    this.cameraWorldPosition = new THREE.Vector3();
    this.rotationMatrix = new THREE.Matrix4();
    this.lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
    this.clipPlane = new THREE.Vector4();

    // For debug only, show the normal and plane of the mirror
    var debugMode = options.debugMode !== undefined ? options.debugMode : false;

    if ( debugMode ) {

        var arrow = new THREE.ArrowHelper( new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 0, 0 ), 10, 0xffff80 );
        var planeGeometry = new THREE.Geometry();
        planeGeometry.vertices.push( new THREE.Vector3( - 10, - 10, 0 ) );
        planeGeometry.vertices.push( new THREE.Vector3( 10, - 10, 0 ) );
        planeGeometry.vertices.push( new THREE.Vector3( 10, 10, 0 ) );
        planeGeometry.vertices.push( new THREE.Vector3( - 10, 10, 0 ) );
        planeGeometry.vertices.push( planeGeometry.vertices[ 0 ] );
        var plane = new THREE.Line( planeGeometry, new THREE.LineBasicMaterial( { color: 0xffff80 } ) );

        this.add( arrow );
        this.add( plane );

    }

    if ( camera instanceof THREE.PerspectiveCamera ) {

        this.camera = camera;

    } else {

        this.camera = new THREE.PerspectiveCamera();
        console.log( this.name + ': camera is not a Perspective Camera!' );

    }

    this.textureMatrix = new THREE.Matrix4();

    this.mirrorCamera = this.camera.clone();
    this.mirrorCamera.matrixAutoUpdate = true;

    var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

    this.texture = new THREE.WebGLRenderTarget( width, height, parameters );
    this.tempTexture = new THREE.WebGLRenderTarget( width, height, parameters );

    var mirrorShader = THREE.ShaderLib[ "mirror" ];
    var mirrorUniforms = THREE.UniformsUtils.clone( mirrorShader.uniforms );

    this.material = new THREE.ShaderMaterial( {

        fragmentShader: mirrorShader.fragmentShader,
        vertexShader: mirrorShader.vertexShader,
        uniforms: mirrorUniforms

    } );

    this.material.uniforms.map.value = options.map;
    this.material.uniforms.mask.value = options.mask;
    this.material.uniforms.min.value = options.min || .1;
    this.material.uniforms.max.value = options.max || .9;

    this.material.defines = {
        USE_MAP: options.map != undefined,
        USE_MASK: options.mask != undefined,
    };

    this.material.uniforms.mirrorSampler.value = this.texture;
    this.material.uniforms.mirrorColor.value = mirrorColor;
    this.material.uniforms.textureMatrix.value = this.textureMatrix;

    if ( ! THREE.Math.isPowerOfTwo( width ) || ! THREE.Math.isPowerOfTwo( height ) ) {

        this.texture.generateMipmaps = false;
        this.tempTexture.generateMipmaps = false;

    }

    // direction
    options.dir = options.dir || 'up';
    this.setDirection(options.dir);

    this.updateTextureMatrix();
    // this.render();

    var s = this;
    if (Game && Game.instance) {
        Game.instance.addEventListener(Game.UPDATE, function() {
            s.render();
        });
    }
};

THREE.Mirror.prototype = Object.create( THREE.Object3D.prototype );
THREE.Mirror.prototype.constructor = THREE.Mirror;

THREE.Mirror.prototype.renderWithMirror = function ( otherMirror ) {

    // update the mirror matrix to mirror the current view
    this.updateTextureMatrix();
    this.matrixNeedsUpdate = false;

    // set the camera of the other mirror so the mirrored view is the reference view
    var tempCamera = otherMirror.camera;
    otherMirror.camera = this.mirrorCamera;

    // render the other mirror in temp texture
    otherMirror.renderTemp();
    otherMirror.material.uniforms.mirrorSampler.value = otherMirror.tempTexture;

    // render the current mirror
    this.render();
    this.matrixNeedsUpdate = true;

    // restore material and camera of other mirror
    otherMirror.material.uniforms.mirrorSampler.value = otherMirror.texture;
    otherMirror.camera = tempCamera;

    // restore texture matrix of other mirror
    otherMirror.updateTextureMatrix();

};

THREE.Mirror.prototype.updateTextureMatrix = function () {

    this.updateMatrixWorld();
    this.camera.updateMatrixWorld();

    this.mirrorWorldPosition.setFromMatrixPosition( this.matrixWorld );
    this.cameraWorldPosition.setFromMatrixPosition( this.camera.matrixWorld );

    this.rotationMatrix.extractRotation( this.matrixWorld );

    this.normal.set( 0, 0, 1 );
    this.normal.applyMatrix4( this.rotationMatrix );

    var view = this.mirrorWorldPosition.clone().sub( this.cameraWorldPosition );
    view.reflect( this.normal ).negate();
    view.add( this.mirrorWorldPosition );

    this.rotationMatrix.extractRotation( this.camera.matrixWorld );

    this.lookAtPosition.set( 0, 0, - 1 );
    this.lookAtPosition.applyMatrix4( this.rotationMatrix );
    this.lookAtPosition.add( this.cameraWorldPosition );

    var target = this.mirrorWorldPosition.clone().sub( this.lookAtPosition );
    target.reflect( this.normal ).negate();
    target.add( this.mirrorWorldPosition );

    this.up.set( 0, - 1, 0 );
    this.up.applyMatrix4( this.rotationMatrix );
    this.up.reflect( this.normal ).negate();

    this.mirrorCamera.position.copy( view );
    this.mirrorCamera.up = this.up;
    this.mirrorCamera.lookAt( target );

    this.mirrorCamera.updateProjectionMatrix();
    this.mirrorCamera.updateMatrixWorld();
    this.mirrorCamera.matrixWorldInverse.getInverse( this.mirrorCamera.matrixWorld );

    // Update the texture matrix
    this.textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
                            0.0, 0.5, 0.0, 0.5,
                            0.0, 0.0, 0.5, 0.5,
                            0.0, 0.0, 0.0, 1.0 );
    this.textureMatrix.multiply( this.mirrorCamera.projectionMatrix );
    this.textureMatrix.multiply( this.mirrorCamera.matrixWorldInverse );

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    this.mirrorPlane.setFromNormalAndCoplanarPoint( this.normal, this.mirrorWorldPosition );
    this.mirrorPlane.applyMatrix4( this.mirrorCamera.matrixWorldInverse );

    this.clipPlane.set( this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant );

    var q = new THREE.Vector4();
    var projectionMatrix = this.mirrorCamera.projectionMatrix;

    q.x = ( Math.sign( this.clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
    q.y = ( Math.sign( this.clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
    q.z = - 1.0;
    q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

    // Calculate the scaled plane vector
    var c = new THREE.Vector4();
    c = this.clipPlane.multiplyScalar( 2.0 / this.clipPlane.dot( q ) );

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[ 2 ] = c.x;
    projectionMatrix.elements[ 6 ] = c.y;
    projectionMatrix.elements[ 10 ] = c.z + 1.0 - this.clipBias;
    projectionMatrix.elements[ 14 ] = c.w;

};

THREE.Mirror.prototype.render = function () {

    if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

    this.matrixNeedsUpdate = true;

    // Render the mirrored view of the current scene into the target texture
    var scene = this;

    while ( scene.parent !== null ) {

        scene = scene.parent;

    }

    if ( scene !== undefined && scene instanceof THREE.Scene ) {

        // We can't render ourself to ourself
        var visible = this.material.visible;
        this.material.visible = false;

        this.renderer.render( scene, this.mirrorCamera, this.texture, true );

        this.material.visible = visible;

    }

};

THREE.Mirror.prototype.renderTemp = function () {

    if ( this.matrixNeedsUpdate ) this.updateTextureMatrix();

    this.matrixNeedsUpdate = true;

    // Render the mirrored view of the current scene into the target texture
    var scene = this;

    while ( scene.parent !== null ) {

        scene = scene.parent;

    }

    if ( scene !== undefined && scene instanceof THREE.Scene ) {

        this.renderer.render( scene, this.mirrorCamera, this.tempTexture, true );

    }

};


THREE.Mirror.prototype.setDirection = function (dirStr) {
    this.quaternion.set(0,0,0,1);
    switch (dirStr) {
        case 'up':
            this.rotateX(-Math.PI / 2);
        break;
        case 'down':
            this.rotateX(Math.PI / 2);
        break;
        case 'left':
            this.rotateY(-Math.PI / 2);
        break;
        case 'right':
            this.rotateY(-Math.PI / 2);
        break;    
        case 'front':
            this.rotateY(-Math.PI);
        break;    
        case 'back':
            this.rotateX(Math.PI);
        break;
        default:
        break;
    }
}

module.exports = function() {};