'use strict';

var BaseVideo = require('./base-video');
var _ = require('underscore');
var ElementKit = require('element-kit');

var Youtube = function (options) {
    this.initialize(options);
};

Youtube.prototype = _.extend({}, BaseVideo.prototype, {

    /**
     * Initialization.
     * @param {object} options - Options passed into instance
     * @extends BaseVideo
     * @param {HTMLVideoElement} options.el - The video element
     * @param {string} [options.autoplay] - A boolean of whether to automatically play the video once player is loaded
     * @param {string} [options.width] - The width of the player
     * @param {string} [options.height] - The height of the player
     * @param {string} [options.playingCssClass] - The css class that will be applied when a video starts playing
     * @param {string} [options.loadingCssClass] - The css class that will be applied when the player is loading
     * @param {string} [options.customWrapperClass] - The css class that will be applied to the parent element of the video element
     */
    initialize: function (options) {

        var el = options.el || document.createDocumentFragment();

        this.options = _.extend({
            el: el,
            autoplay: el.getAttribute('autoplay'),
            width: el.getAttribute('width'),
            height: el.getAttribute('height'),
            playingCssClass: 'video-playing',
            loadingCssClass: 'video-loading',
            customWrapperClass: 'video-wrapper'
        }, options);

        BaseVideo.prototype.initialize.call(this, this.options);

        Youtube.prototype.players = Youtube.prototype.players || {};
        Youtube.prototype.players[this.vpid] = this;

        this.el = this.options.el;
        this._origParent = this.el.parentNode;

        // build player vars
        this._playerVars = _.extend({
            autoplay: this.options.autoplay ? 1 : 0
        }, this.getPlayerVars());

    },

    /**
     * Gets the source url of the youtube video.
     * @returns {String} Returns the source url string if there is one
     */
    getSourceUrl: function () {
        var sources = this.el.getElementsByTagName('source'),
            i, count = sources.length, source;
        if (!this.src) {
            for (i = 0; i < count; i++) {
                source = sources[i];
                if (source.getAttribute('type') === 'video/youtube') {
                    this.src = source.getAttribute('src');
                    break;
                }
            }
            this.src = this.src || '';
        }
        return this.src;
    },

    /**
     * Loads the video and reset the play head to the beginning of the video.
     * @param callback
     */
    load: function (callback) {
        // create parent div to show loading state
        this._container = document.createElement('div');
        this._container.setAttribute('id', 'vplayer' + this.vpid + '-container');
        this._container.setAttribute('class', this.options.customWrapperClass);

        if (this._origParent && this._origParent.contains(this.el)) {
            this._origParent.replaceChild(this._container, this.el);
        }

        this._container.kit.classList.add(this.options.loadingCssClass);
        this._loadScript(function () {
            this._buildPlayer(function (player) {
                this.player = player;
                this._container.kit.classList.remove(this.options.loadingCssClass);
                if (callback) {
                    callback(player, this._container);
                }
            }.bind(this));
        }.bind(this));
    },

    /**
     * Builds the player instance (creates it if doesnt already exist).
     * @param {Function} callback - The API will call this function when the video player is ready.
     */
    _buildPlayer: function (callback) {
        var done = function (player) {
            if (callback) {
                callback(player);
            }
        };
        if (!this._p) {
            this._p = this._createPlayer(done);
        } else {
            done(this._p);
        }
    },

    /**
     * Creates and returns the player instance.
     * @param onComplete
     * @private
     */
    _createPlayer: function (onComplete) {
        var id = 'vplayer' + this.vpid;

        // create youtube element
        this._ytEl = document.createElement('div');
        this._ytEl.setAttribute('id', id);
        this._container.appendChild(this._ytEl);

        this._videoId = this.getVideoId(this.getSourceUrl());

        return new YT.Player(id, {
            height: this.options.height,
            width: this.options.width,
            playerVars: this._playerVars,
            videoId: this._videoId,
            events: {
                onReady: function (e) {
                    onComplete(e.target);
                },
                onStateChange: this._onStateChange.bind(this)
            }
        });
    },

    /**
     * Generates playerVars from a Youtube URL and puts it into a neat little object.
     * @returns {Object}
     */
    getPlayerVars: function () {
        var queryString = this.getSourceUrl().split('?')[1] || '',
            a = queryString.split('&');
        if (a == '') return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=', 2);
            if (p.length == 1)
                b[p[0]] = '';
            else
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
        }
        return b;
    },

    /**
     * Gets the current video id from a youtube url and returns it.
     * @param {String} url - The video url
     * @returns {Number|string|*|Youtube._videoId} - The video id extracted
     */
    getVideoId: function (url) {
        var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
        return url.replace(re, '$1');
    },

    /**
     * Load the script required for video player.
     * @param callback
     * @private
     */
    _loadScript: function (callback) {
        if (Youtube.prototype._scriptLoaded) {
            return callback ? callback() : null;
        }

        if (!Youtube.prototype._script) {
            // Load the IFrame Player API code asynchronously.
            var script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
            Youtube.prototype._script = script;
        }
        window.onYouTubeIframeAPIReady = function () {
            callback ? callback() : null;
            Youtube.prototype._scriptLoaded = true;
        }.bind(this)
    },

    /**
     * When the video's state changes.
     * @param {Object} obj - Youtube's data object
     * @param {Number} obj.state - The number representing the state of the video
     * @private
     */
    _onStateChange: function (obj) {
        var stateMap = {
                '-1': {name: 'unstarted'},
                '0': {name: 'ended', method: this.onEnd},
                '1': {name: 'playing', method: this.onPlay},
                '2': {name: 'paused', method: this.onPause},
                '3': {name: 'buffering'},
                '5': {name: 'cued'}
            },
            state = '' + obj.data; // to string
        if (stateMap[state].method) {
            stateMap[state].method.call(this);
        }
    },

    /**
     * Creates a new event and triggers it on the video element.
     * @param {String} event - The name of the event to trigger
     * @private
     */
    _triggerEvent: function (event) {
        // use old-way of constructing custom events for IE9 and IE10
        var e = document.createEvent('CustomEvent');
        e.initCustomEvent(event, false, false, null);
        this.el.dispatchEvent(e);
    },

    /**
     * Plays the video from it’s current location.
     */
    play: function () {
        // add class so things like play button image,
        // thumbnail/poster image, etc can be manipulated if needed
        if (!this.getSourceUrl()) {
            console.warn('youtube video error: you cannot call play() method on a video element that has no youtube source url');
        } else if (this.player) {
            this.player.playVideo();
        }
    },

    /**
     * Plays the video from it’s current location.
     */
    onPlay: function () {
        // add class so things like play button image,
        // thumbnail/poster image, etc can be manipulated if needed
        this._container.classList.add(this.options.playingCssClass);
        this._triggerEvent('play');
    },

    /**
     * Pauses the video at the then-current time.
     */
    pause: function () {
        this.player ? this.player.pauseVideo() : null;
    },

    /**
     * When the video is paused.
     */
    onPause: function () {
        this._container.classList.remove(this.options.playingCssClass);
        this._triggerEvent('pause');
    },

    /**
     * Stops and cancels loading of the current video.
     */
    stop: function () {
        this.player ? this.player.stopVideo() : null;
    },

    /**
     * When the video has finished playing.
     */
    onEnd: function () {
        this._container.classList.remove(this.options.playingCssClass);
        this._triggerEvent('ended');
    },

    /**
     * Destroys the video instance.
     */
    destroy: function () {
        var script = Youtube.prototype._script,
            cachedPlayers = Youtube.prototype.players;

        // just in case destroy is called before youtube script callback happens
        if (this._container) {
            this._container.kit.classList.remove(this.options.loadingCssClass);
        }

        // remove from cache
        delete cachedPlayers[this.vpid];
        window.onYouTubeIframeAPIReady = function(){};

        if (script && !_.keys(cachedPlayers).length) {
            script.parentNode.removeChild(script);
            Youtube.prototype._script = null;
            Youtube.prototype._scriptLoaded = null;
        }

        // get rid of container and place video element back in the dom exactly the way we found it
        if (this._origParent && this._origParent.contains(this._container)) {
            this._origParent.replaceChild(this.el, this._container);
        }

        BaseVideo.prototype.destroy.call(this);
    }
});

module.exports = window.Video.Youtube = Youtube;