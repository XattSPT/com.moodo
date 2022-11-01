'use strict';

const Homey = require('homey');

class Moodo extends Homey.App {
    onInit() {
        console.log('Successfully init Moodo version: %s', this.homey.app.manifest.version);
    };
}

module.exports = Moodo;
