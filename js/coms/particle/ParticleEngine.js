/**
* @author Lee Stemkoski   http://www.adelphi.edu/~stemkoski/
*/

///////////////////////////////////////////////////////////////////////////////

/////////////
// SHADERS //
/////////////

// attribute: data that may be different for each particle (such as size and color);
//      can only be used in vertex shader
// varying: used to communicate data from vertex shader to fragment shader
// uniform: data that is the same for each particle (such as texture)

particleVertexShader = [
	"attribute vec3  customColor;",
	"attribute float customOpacity;",
	"attribute float customSize;",
	"attribute float customAngle;",
	"attribute float customVisible;",  // float used as boolean (0 = false, 1 = true)
	"varying vec4  vColor;",
	"varying float vAngle;",
	"void main()",
	"{",
		"if ( customVisible > 0.5 )", 				// true
			"vColor = vec4( customColor, customOpacity);", //    customOpacity set color associated to vertex; use later in fragment shader.
		"else",							// false
			"vColor = vec4(0.0);", 		//     make particle invisible.
			
		"vAngle = customAngle;",

		"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
		"gl_PointSize = customSize * ( 300.0 / length( mvPosition.xyz ) );",     // scale particles as objects in 3D space
		"gl_Position = projectionMatrix * mvPosition;",
	"}"
].join("\n");

particleFragmentShader = [
	"uniform sampler2D texture;",
	"varying vec4 vColor;", 	
	"varying float vAngle;",   
	"void main()", 
	"{",
		"vec4 color = vColor;",

		"#ifdef TEXTURE",
			"float c = cos(vAngle);",
			"float s = sin(vAngle);",
			"vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,", 
			                      "c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);",  // rotate UV coordinates to rotate texture
		    "color = color * texture2D( texture,  rotatedUV );",
	    "#endif",

	    "#ifdef USE_MESH",				// use custom mesh object
	    	"color = vec4(0.0);",
	    "#endif",

		"gl_FragColor = color;",    // sets an otherwise white particle texture to desired color
	"}"
].join("\n");

///////////////////////////////////////////////////////////////////////////////

/////////////////
// TWEEN CLASS //
/////////////////

function Tween(timeArray, valueArray) {
	this.times  = timeArray || [];
	this.values = valueArray || [];
}

Tween.prototype.lerp = function(t) {
	var i = 0;
	var n = this.times.length;
	while (i < n && t > this.times[i])  
		i++;
	if (i == 0) return this.values[0];
	if (i == n)	return this.values[n-1];
	var p = (t - this.times[i-1]) / (this.times[i] - this.times[i-1]);
	if (this.values[0] instanceof THREE.Vector3)
		return this.values[i-1].clone().lerp( this.values[i], p );
	else // its a float
		return this.values[i-1] + p * (this.values[i] - this.values[i-1]);
}

///////////////////////////////////////////////////////////////////////////////

////////////////////
// PARTICLE CLASS //
////////////////////

function Particle()
{
	this.position     = new THREE.Vector3();
	this.velocity     = new THREE.Vector3(); // units per second
	this.acceleration = new THREE.Vector3();

	this.angle             = 0.0;
	this.angleVelocity     = 0.0; // degrees per second
	this.angleAcceleration = 0.0; // degrees per second, per second
	
	this.size = 16.0;

	this.color   = new THREE.Color();
	this.opacity = 1.0;
			
	this.age   = 0;
	this.alive = 0.0; // use float instead of boolean for shader purposes	

	this.lastPos = new THREE.Vector3();
	this.worldVelocity = new THREE.Vector3();

	this.mesh = null;
}

Particle.prototype.update = function(dt, engine)
{
	var self = this;

	var curPos = engine.particleMesh.getWorldPosition();

	// world effect tween
	//*
	if ( engine.worldEffectTween.times.length > 0 ) {
		//*
		if (!engine.worldRecord) {
			engine.worldRecord = true;
			engine.worldValues = [];
			engine.worldEffectTween.values.forEach(function(itm) {
				engine.worldValues.push(itm.clone());
			});
		}

		// update world velocity
		if (engine.worldSpace) {
			engine.worldEffectTween.values.forEach(function(itm, index) {
				var v = engine.worldValues[index].clone();
				itm.copy(engine.particleMesh.inverseTransformVector(v));
			});
		}
		//*/

		this.worldVelocity = engine.worldEffectTween.lerp( this.age );
	}
	//*/

	this.position.add( this.velocity.clone().multiplyScalar(dt) )
					.sub(curPos.clone().sub(this.lastPos))					// particle world pos
					.add(this.worldVelocity);								// world effect direction simulate wind

	this.lastPos = curPos;

	// this.vector = engine.particleMesh.worldToLocal(this.velocity);
	this.velocity.add( this.acceleration.clone().multiplyScalar(dt) );
	
	// convert from degrees to radians: 0.01745329251 = Math.PI/180
	this.angle         += this.angleVelocity     * 0.01745329251 * dt;
	this.angleVelocity += this.angleAcceleration * 0.01745329251 * dt;

	this.age += dt;
	
	// if the tween for a given attribute is nonempty,
	//  then use it to update the attribute's value

	if ( engine.sizeTween.times.length > 0 )
		this.size = engine.sizeTween.lerp( this.age );
				
	if ( engine.colorTween.times.length > 0 )
	{
		var colorHSL = engine.colorTween.lerp( this.age );
		this.color = new THREE.Color().setHSL( colorHSL.x, colorHSL.y, colorHSL.z );
	}
	
	if ( engine.opacityTween.times.length > 0 )
		this.opacity = engine.opacityTween.lerp( this.age );

	// use custom mesh object particle
	var s = this;
	if (s.mesh) {
		s.mesh.position.copy(s.position);
		var r = this.angle;
		if (r > 360) {r = 0;}
		s.mesh.rotation.y = r;
		s.mesh.rotation.z = -r;
		s.mesh.scale.set(s.size, s.size, s.size);
		s.mesh.material.color.copy(s.color);
		s.mesh.material.opacity = s.opacity;
	}
}
	
///////////////////////////////////////////////////////////////////////////////

///////////////////////////
// PARTICLE ENGINE CLASS //
///////////////////////////

var Type = Object.freeze({ "CUBE":1, "SPHERE":2 });

function ParticleEngine()
{
	/////////////////////////
	// PARTICLE PROPERTIES //
	/////////////////////////
	
	this.positionStyle = Type.CUBE;		
	this.positionBase   = new THREE.Vector3();
	// cube shape data
	this.positionSpread = new THREE.Vector3();
	// sphere shape data
	this.positionRadius = 0; // distance from base at which particles start
	
	this.velocityStyle = Type.CUBE;	
	// cube movement data
	this.velocityBase       = new THREE.Vector3();
	this.velocitySpread     = new THREE.Vector3(); 
	// sphere movement data
	//   direction vector calculated using initial position
	this.speedBase   = 0;
	this.speedSpread = 0;
	
	this.accelerationBase   = new THREE.Vector3();
	this.accelerationSpread = new THREE.Vector3();	
	
	this.angleBase               = 0;
	this.angleSpread             = 0;
	this.angleVelocityBase       = 0;
	this.angleVelocitySpread     = 0;
	this.angleAccelerationBase   = 0;
	this.angleAccelerationSpread = 0;
	
	this.sizeBase   = 0.0;
	this.sizeSpread = 0.0;
	this.sizeTween  = new Tween();

	// ztc 20160505 add 'pause' feature support
	this.pause = true;
	this.initialized = false;
	this.customMesh = null;
	// this.meshes = [];
	this.meshGoup = new THREE.Group();
	this.worldValues = null;
	this.worldRecord = false;
			
	// store colors in HSL format in a THREE.Vector3 object
	// http://en.wikipedia.org/wiki/HSL_and_HSV
	this.colorBase   = new THREE.Vector3(0.0, 1.0, 0.5); 
	this.colorSpread = new THREE.Vector3(0.0, 0.0, 0.0);
	this.colorTween  = new Tween();
	
	this.opacityBase   = 1.0;
	this.opacitySpread = 0.0;
	this.opacityTween  = new Tween();

	this.blendStyle = THREE.NormalBlending; // false;

	this.particleArray = [];
	this.particlesPerSecond = 100;
	this.particleDeathAge = 1.0;
	
	////////////////////////
	// EMITTER PROPERTIES //
	////////////////////////
	
	this.emitterAge      = 0.0;
	this.emitterAlive    = true;
	this.emitterDeathAge = Number.MAX_VALUE; // time (seconds) at which to stop creating particles.

	// How many particles could be active at any time?
	this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.emitterDeathAge );

	//////////////
	// THREE.JS // // time (seconds) at which to stop creating particles.
	//////////////
	
	this.particleGeometry = new THREE.BufferGeometry();
	this.particleTexture  = null;
	this.particleMaterial = new THREE.ShaderMaterial( 
	{
		uniforms: 
		{
			texture:   { type: "t", value: this.particleTexture },
		},
		vertexShader:   particleVertexShader,
		fragmentShader: particleFragmentShader,
		transparent: true, // alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
		blending: THREE.NormalBlending, depthTest: true
		
	});
	this.particleMesh = new THREE.Mesh();

	// auto update particles
	this.updateCallback = this._update.bind(this);

	var s = this;
	Game.instance.addEventListener(Game.UPDATE, s.updateCallback);
}

ParticleEngine.Type = Type;
ParticleEngine.Tween = Tween;

ParticleEngine.prototype.setValues = function( parameters )
{
	if ( parameters === undefined ) return;
	
	this.initialized = false;
	// clear any previous tweens that might exist
	this.sizeTween    = new Tween();
	this.colorTween   = new Tween();
	this.opacityTween = new Tween();
	this.worldEffectTween = new Tween();
	
	for ( var key in parameters ) 
		this[ key ] = parameters[ key ];
	
	// attach tweens to particles
	// Particle.prototype.sizeTween    = this.sizeTween;
	// Particle.prototype.colorTween   = this.colorTween;
	// Particle.prototype.opacityTween = this.opacityTween;	
	
	// calculate/set derived particle engine values
	this.particleArray = [];
	this.emitterAge      = 0.0;
	this.emitterAlive    = true;
	this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.emitterDeathAge );
	
	this.particleGeometry = null;
	this.particleMaterial = new THREE.ShaderMaterial( 
	{
		uniforms: 
		{
			texture:   { type: "t", value: this.particleTexture },
		},
		vertexShader:   particleVertexShader,
		fragmentShader: particleFragmentShader,
		transparent: true, // alphaTest: 0.5, // if having transparency issues, try including: alphaTest: 0.5, 
		blending: THREE.NormalBlending, depthWrite: false
	});

	this.customMesh = parameters.customMesh;

	this.particleMaterial.defines = {
		"TEXTURE": this.particleTexture != null,
		"USE_MESH": this.customMesh != null
	};

	// destroy last particles , true : means don't remove update callback
	this.destroy(true);

	this.particleMesh = new THREE.Points();
}
	
// helper functions for randomization
ParticleEngine.prototype.randomValue = function(base, spread)
{
	return base + spread * (Math.random() - 0.5);
}

ParticleEngine.prototype.randomVector3 = function(base, spread)
{
	var rand3 = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
	return new THREE.Vector3().addVectors( base, new THREE.Vector3().multiplyVectors( spread, rand3 ) );
}

ParticleEngine.prototype.resetParticale = function( particle ) {
	if (this.positionStyle == Type.CUBE)
		particle.position = this.randomVector3( this.positionBase, this.positionSpread ); 
	if (this.positionStyle == Type.SPHERE)
	{
		var z = 2 * Math.random() - 1;
		var t = 6.2832 * Math.random();
		var r = Math.sqrt( 1 - z*z );
		var vec3 = new THREE.Vector3( r * Math.cos(t), r * Math.sin(t), z );
		particle.position = new THREE.Vector3().addVectors( this.positionBase, vec3.multiplyScalar( this.positionRadius ) );
	}

	// record particleMesh world postion on particle created
	particle.lastPos = this.particleMesh.getWorldPosition();

	// clone custom mesh
	if (this.customMesh && !particle.mesh) {
		this.emissive = this.emissive || .7;

		if (this.customMesh instanceof THREE.Mesh) {
			particle.mesh = this.customMesh.clone();
		} else if (this.customMesh instanceof Array) {	// random mesh array with rate: [mesh, .5, mesh, .2, mesh]
			if (this.customMesh.length > 2 && typeof this.customMesh[1] == 'number') {
				var r = Math.random();
				var index = -1;
				var all = 0;
				for (var i = 1; i < this.customMesh.length; i++) {
					all += this.customMesh[i];
					if (r <= all) {
						index = i - 1;
						break;
					}
				}
				if (index == -1) {
					index = this.customMesh.length - 1;
				}
				particle.mesh = this.customMesh[index].clone();
			} else {	// random mesh array
				particle.mesh = this.customMesh[Math.floor(Math.random() * this.customMesh.length)].clone();
			}
		}

		particle.mesh.material = particle.mesh.material.clone();
		particle.mesh.material.emissive.setRGB(this.emissive, this.emissive, this.emissive);
		particle.mesh.material.depthWrite = false;	// do not write depth
		this.meshGoup.add(particle.mesh);
		particle.mesh.material.transparent = true;
	}
		
	if ( this.velocityStyle == Type.CUBE )
	{
		particle.velocity     = this.randomVector3( this.velocityBase,     this.velocitySpread ); 
	}
	if ( this.velocityStyle == Type.SPHERE )
	{
		var direction = new THREE.Vector3().subVectors( particle.position, this.positionBase );
		var speed     = this.randomValue( this.speedBase, this.speedSpread );
		particle.velocity  = direction.normalize().multiplyScalar( speed );
	}
	
	particle.acceleration = this.randomVector3( this.accelerationBase, this.accelerationSpread ); 

	particle.angle             = this.randomValue( this.angleBase,             this.angleSpread );
	particle.angleVelocity     = this.randomValue( this.angleVelocityBase,     this.angleVelocitySpread );
	particle.angleAcceleration = this.randomValue( this.angleAccelerationBase, this.angleAccelerationSpread );

	particle.size = this.randomValue( this.sizeBase, this.sizeSpread );

	var color = this.randomVector3( this.colorBase, this.colorSpread );
	particle.color = new THREE.Color().setHSL( color.x, color.y, color.z );
	
	particle.opacity = this.randomValue( this.opacityBase, this.opacitySpread );

	particle.age   = 0;
	particle.alive = 0; // particles initialize as inactive
};

ParticleEngine.prototype.createParticle = function() {
	var particle = new Particle();
	this.resetParticale(particle);

	return particle;
}

ParticleEngine.prototype.initialize = function() {
	this.initialized = true;

	var posArr = [],
		visibleArr = [],
		colorArr = [],
		opacityArr = [],
		sizeArr = [],
		angleArr = [];

	// link particle data with geometry/material data
	for (var i = 0; i < this.particleCount; i++)
	{
		// remove duplicate code somehow, here and in update function below.
		this.particleArray[i] = this.createParticle();
		// this.particleGeometry.vertices[i] = this.particleArray[i].position;
		var p = this.particleArray[i];
		posArr.push(p.position.x, p.position.y, p.position.z);
		visibleArr.push(p.alive);
		colorArr.push(p.color.r, p.color.g, p.color.b);
		opacityArr.push(p.opacity);
		sizeArr.push(p.size);
		angleArr.push(p.angle);
	}
	this.particleGeometry = new THREE.BufferGeometry();

	this.particleGeometry.addAttribute('position', new THREE.BufferAttribute( new Float32Array(posArr), 3 ));
	this.particleGeometry.addAttribute('customVisible', new THREE.BufferAttribute( new Float32Array(visibleArr), 1 ));
	this.particleGeometry.addAttribute('customColor', new THREE.BufferAttribute( new Float32Array(colorArr), 3 ));
	this.particleGeometry.addAttribute('customOpacity', new THREE.BufferAttribute( new Float32Array(opacityArr), 1 ));
	this.particleGeometry.addAttribute('customSize', new THREE.BufferAttribute( new Float32Array(sizeArr), 1 ));
	this.particleGeometry.addAttribute('customAngle', new THREE.BufferAttribute( new Float32Array(angleArr), 1 ));
	
	this.particleMaterial.blending = this.blendStyle;
	// if ( this.blendStyle != THREE.NormalBlending) 
	// 	this.particleMaterial.depthTest = false;
	
	this.particleMesh = new THREE.Points( this.particleGeometry, this.particleMaterial );
	this.particleMesh.dynamic = true;
	this.particleMesh.alphaTest = 0.5;

	this.particleMesh.add(this.meshGoup);
	Game.instance.scene.add( this.particleMesh );

	console.log('ParticleEngine initialize.');
}

ParticleEngine.prototype.update = function(dt)
{
	if (!this.initialized) {
		return;
	}

	var recycleIndices = [];
	
	// update particle data
	for (var i = 0; i < this.particleCount; i++)
	{
		if ( this.particleArray[i].alive )
		{
			this.particleArray[i].update(dt, this);

			// check if particle should expire
			// could also use: death by size<0 or alpha<0.
			if ( this.particleArray[i].age > this.particleDeathAge ) 
			{
				this.particleArray[i].alive = 0.0;
				recycleIndices.push(i);
			}
			
			// YOU WILL CHANGE ATTRIBUTE's array !!!!
			this.particleGeometry.attributes.position.array[i * 3] = this.particleArray[i].position.x;
			this.particleGeometry.attributes.position.array[i * 3 + 1] = this.particleArray[i].position.y;
			this.particleGeometry.attributes.position.array[i * 3 + 2] = this.particleArray[i].position.z;

			this.particleGeometry.attributes.customVisible.array[i]       = this.particleArray[i].alive;
			this.particleGeometry.attributes.customColor.array[i * 3]     = this.particleArray[i].color.r;
			this.particleGeometry.attributes.customColor.array[i * 3 + 1] = this.particleArray[i].color.g;
			this.particleGeometry.attributes.customColor.array[i * 3 + 2] = this.particleArray[i].color.b;
			this.particleGeometry.attributes.customOpacity.array[i]       = this.particleArray[i].opacity;
			this.particleGeometry.attributes.customSize.array[i]          = this.particleArray[i].size;
			this.particleGeometry.attributes.customAngle.array[i]         = this.particleArray[i].angle;

			this.particleGeometry.attributes.position.needsUpdate      = true;
			this.particleGeometry.attributes.customVisible.needsUpdate = true;
			this.particleGeometry.attributes.customColor.needsUpdate   = true;
			this.particleGeometry.attributes.customOpacity.needsUpdate = true;
			this.particleGeometry.attributes.customSize.needsUpdate    = true;
			this.particleGeometry.attributes.customAngle.needsUpdate   = true;
		}		
	}

	// check if particle emitter is still running
	if ( !this.emitterAlive ) return;

	// if no particles have died yet, then there are still particles to activate
	if ( this.emitterAge < this.particleDeathAge && !this.pause) {
		// determine indices of particles to activate
		var startIndex = Math.round( this.particlesPerSecond * (this.emitterAge +  0) );
		var   endIndex = Math.round( this.particlesPerSecond * (this.emitterAge + dt) );
		if  ( endIndex > this.particleCount ) 
			  endIndex = this.particleCount; 
			  
		for (var i = startIndex; i < endIndex; i++) {
			this.particleArray[i].alive = 1.0;		
		}
	}

	// if any particles have died while the emitter is still running, we imediately recycle them
	if (!this.pause) {
		for (var j = 0; j < recycleIndices.length; j++)
		{
			var i = recycleIndices[j];
			this.resetParticale(this.particleArray[i]);
			this.particleArray[i].alive = 1.0; // activate right away
			// this.particleGeometry.vertices[i] = this.particleArray[i].position;
			this.particleGeometry.attributes.position.array[i * 3] = this.particleArray[i].position.x;
			this.particleGeometry.attributes.position.array[i * 3 + 1] = this.particleArray[i].position.y;
			this.particleGeometry.attributes.position.array[i * 3 + 2] = this.particleArray[i].position.z;
		}
	}

	// stop emitter?
	this.emitterAge += dt;
	if ( this.emitterAge > this.emitterDeathAge )  this.emitterAlive = false;
}

ParticleEngine.prototype._update = function(dt) {
	var s = this;
	s.update(dt / 1000);
};

ParticleEngine.prototype.stop = function() {
	this.pause = true;
};

ParticleEngine.prototype.start = function() {
	if (!this.initialized) {
		this.initialize();
	}

	this.pause = false;

	this.emitterAge = 0;
};

ParticleEngine.prototype.destroy = function(boo) {
	var s = this;
	if (!boo) {
		Game.instance.removeEventListener(Game.UPDATE, s.updateCallback);
	}

	// delete old custom meshes
	if (s.customMesh) {
		while(s.meshGoup.children.length > 0) {
			s.meshGoup.remove(s.meshGoup.children[0]);
		}
	}

    Game.instance.scene.remove( s.particleMesh );
}

ParticleEngine.prototype.setPosition = function(pos) {
	switch (arguments.length) {
		case 1:
			this.particleMesh.position.copy(pos);
		break;
		case 3:
			this.particleMesh.position.set(arguments[0], arguments[1], arguments[2]);
		break;
		default:
		break;
	}
};

ParticleEngine.prototype.setTransform = function(obj) {
	utils.sameTransform(this.particleMesh, obj);
};

///////////////////////////////////////////////////////////////////////////////

module.exports = ParticleEngine;