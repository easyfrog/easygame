var have = true;

var tloader = new THREE.TextureLoader();
var lf0 = tloader.load('images/lensFlare/lensflare0.png', undefined, undefined, function() {
    console.log('LensFlare Not Find Texture ERROR!, Copy resources/textures/lensFlare folder to your "images" folder');
    have = false;
});

var lensFlare = null;

if (have) {
    // var lf2 = THREE.ImageUtils.loadTexture('images/lensFlare/lensflare2.png');
    var lf3 = tloader.load('images/lensFlare/hexangle.png');

    lensFlare = new THREE.LensFlare(lf0, 600, 0, THREE.AdditiveBlending);

    lensFlare.add(lf3, 128, 0.55, THREE.AdditiveBlending, new THREE.Color(0x44ff44));
    lensFlare.add(lf3, 128, 0.65, THREE.AdditiveBlending, new THREE.Color(0x44ffff));
    lensFlare.add(lf3, 256, 0.9, THREE.AdditiveBlending, new THREE.Color(0xff4444));
    lensFlare.add(lf3, 128, 1, THREE.AdditiveBlending);

    lensFlare.position.copy(new THREE.Vector3(400, 400, 400));  // normal copy the main light postion

    Game.instance.scene.add(lensFlare);
}

module.exports = lensFlare;

// set lensFlare position: lensFlare.position.copy(light.position);