'use strict';

var _ = require('underscore');

var BaseVideo = function () {};

BaseVideo.prototype = {

    /**
     * Initialization.
     * @param {object} options - Options passed into instance
     */
    initialize: function (options) {

        var el = options.el || document.createDocumentFragment();

        this.options = _.extend({
            el: el,
            src: el.getAttribute('src'),
            autoplay: el.getAttribute('autoplay')
        }, options);

        BaseVideo.prototype.vidCount = BaseVideo.prototype.vidCount || 0;
        BaseVideo.prototype.vidCount++;

        this.vpid = 'v' + BaseVideo.prototype.vidCount;

    },

    /**
     * Adds an event listener to the media element.
     * @param event
     * @param listener
     * @param useCapture
     */
    addEventListener: function (event, listener, useCapture) {
        this.el.addEventListener(event, listener, useCapture);
    },

    /**
     * Removes an event listener fromt the media element.
     * @param event
     * @param listener
     * @param useCapture
     */
    removeEventListener: function (event, listener, useCapture) {
        this.el.removeEventListener(event, listener, useCapture);
    },

    load: function () {
        this.el.load();
    },

    /**
     * Plays the video from it’s current location.
     */
    play: function () {
        this.el.play();
    },

    /**
     * Pauses the video at the then-current time.
     */
    pause: function () {
        this.el.pause();
    },

    /**
     * Destroys the player instance.
     */
    destroy: function () {}

};

window.Video = window.Video || {};

module.exports = BaseVideo;