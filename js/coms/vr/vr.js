require('../../controls/VRControls');
require('../../effects/VREffect');

WebVRConfig = {
    BUFFER_SCALE: 0.5,
};

var game = Game.instance;
var VR = function( ps ) {
    this.control = new THREE.VRControls(game.camera):
    this.effect = new THREE.VREffect(game.renderer);

    this.vrDisplay = null;
    navigator.getVRDisplays().then(function(displays) {
        if (displays.length > 0) {
            vrDisplay = displays[0];
        }
    });

};