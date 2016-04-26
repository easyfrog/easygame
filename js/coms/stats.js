var stats = require('../threejs/stats.min');

module.exports = function() {
    stats = new stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;

    Game.instance.container.appendChild(stats.domElement);

    Game.instance.addEventListener(Game.UPDATE, function() {
        stats.update();
    });
};