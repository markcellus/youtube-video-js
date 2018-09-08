/*!
 * Youtube-video-js v2.0.1
 * https://github.com/mkay581/youtube-video-js#readme
 *
 * Copyright (c) 2018 Mark Kennedy
 * Licensed under the MIT license
 */

import ResourceManager from 'resource-manager-js';

/**
 * A key-value map that maps the video element's MediaEvents to a handler method in this class
 * @type {Object}
 */
let eventMethodMap = {};

let players = new Map();
let scriptPath = 'https://www.youtube.com/iframe_api';
let videoCount = 0;

/**
 * Generates playerVars from a Youtube URL and puts it into a neat little object.
 * @param {string} sourceUrl - The source youtube url
 * @returns {Object}
 */
let getPlayerVars = function (sourceUrl) {
    var queryString = sourceUrl.split('?')[1] || '',
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
};

class YoutubeVideo  {

    /**
     * Initialization.
     * @param {object} options - Options passed into instance
     * @param {HTMLVideoElement} options.el - The video element
     * @param {string} [options.autoplay] - A boolean of whether to automatically play the video once player is loaded
     * @param {string} [options.width] - The width of the player
     * @param {string} [options.height] - The height of the player
     * @param {string} [options.playingCssClass] - The css class that will be applied when a video starts playing
     * @param {string} [options.loadingCssClass] - The css class that will be applied when the player is loading
     * @param {string} [options.customWrapperClass] - The css class that will be applied to the parent element of the video element
     */
    constructor (options) {

        var el = options.el || document.createDocumentFragment();

        this.options = Object.assign({
            el: el,
            autoplay: el.getAttribute('autoplay'),
            width: el.getAttribute('width'),
            forceSSL: false,
            height: el.getAttribute('height'),
            playingCssClass: 'video-playing',
            loadingCssClass: 'video-loading',
            customWrapperClass: 'video-wrapper'
        }, options);

        videoCount++;
        this.el = this.options.el;
        let privateProps = {
            id: videoCount,
            origParent: this.el.parentNode
        };

        // trigger our internal event handling method
        // whenever the youtube api player triggers an event
        eventMethodMap = {
            ended: this._onEnd,
            playing: this._onPlay,
            pause: this._onPause
        };

        // build player vars
        privateProps.playerVars = Object.assign({
            autoplay: this.options.autoplay ? 1 : 0,
            forceSSL: this.options.forceSSL,
        }, getPlayerVars(this.sourceUrl));

        players.set(this, privateProps);

        this.el.play = () => this._play();
        this.el.pause = () => this._pause();
        this.el.load = () => this._load();
    }

    /**
     * Gets the source url of the youtube video.
     * @returns {String} Returns the source url string if there is one
     */
    get sourceUrl () {
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
    }

    /**
     * Loads the video and reset the play head to the beginning of the video.
     * @returns {Promise}
     * @private
     */
    async _load () {
        // create parent div to show loading state
        let instance = players.get(this);
        let container = document.createElement('div');
        let origParent = players.get(this).origParent;
        container.setAttribute('class', this.options.customWrapperClass);
        instance.container = container;

        if (origParent && origParent.contains(this.el)) {
            origParent.replaceChild(container, this.el);
        }
        container.appendChild(this.el);
        // make original video element absolute or it will
        // push the newly created video div down out of view
        this.options.el.style.position = 'absolute';
        // dont allow it to cover the iframe video
        this.options.el.style.zIndex = '-1';

        container.classList.add(this.options.loadingCssClass);
        this.el.dispatchEvent(new CustomEvent('loadstart'));
        await this._loadScript();
        this.ytPlayer = await this._buildPlayer();
        container.classList.remove(this.options.loadingCssClass);
        return this.ytPlayer;
    }

    /**
     * Gets the current video id from a youtube url and returns it.
     * @param {String} url - The video url
     * @returns {Number|string|*|YoutubeVideo.videoId} - The video id extracted
     */
    getVideoId (url) {
        var re = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
        return url.replace(re, '$1');
    }

    /**
     * Plays the video from it’s current location.
     * TODO: make this function return a promise
     * @private
     */
    _play () {
        // add class so things like play button image,
        // thumbnail/poster image, etc can be manipulated if needed
        if (!this.sourceUrl) {
            console.warn('youtube video error: you cannot call play() method on a video element that has no youtube source url');
        } else if (this.ytPlayer) {
            this.ytPlayer.playVideo();
        }
    }

    /**
     * Pauses the video at the then-current time.
     * TODO: make this function return a promise
     * @private
     */
    _pause () {
        this.ytPlayer ? this.ytPlayer.pauseVideo() : null;
    }

    /**
     * Stops and cancels loading of the current video.
     * TODO: make this function return a promise
     * @private
     */
    _stop () {
        this.ytPlayer ? this.ytPlayer.stopVideo() : null;
    }

    /**
     * Load the script required for video player.
     * @returns {Promise}
     * @private
     */
    _loadScript () {
        // Load the IFrame Player API code asynchronously.
        if (!YoutubeVideo.prototype._scriptLoadPromise) {
            YoutubeVideo.prototype._scriptLoadPromise = new Promise((resolve) => {
                // NOTE: youtube's iframe api ready only fires once after first script load
                if (!window.onYouTubeIframeAPIReady) {
                    YoutubeVideo.prototype._triggerYoutubeIframeAPIReady = resolve;
                    window.onYouTubeIframeAPIReady = () => {
                        window.onYouTubeIframeAPIReady = null;
                        // once the script loads once, we are guaranteed for it to
                        // be ready even after destruction of all instances (if consumer
                        // doesnt mangle with it)
                        YoutubeVideo.prototype._triggerYoutubeIframeAPIReady();
                    };
                }
                return ResourceManager.loadScript(scriptPath);
            });
        }
        return YoutubeVideo.prototype._scriptLoadPromise;
    }

    _unloadScript() {
        ResourceManager.unloadScript(scriptPath);
        YoutubeVideo.prototype._scriptLoadPromise = null;
    }

    /**
     * Builds the player instance.
     * @returns {Promise} Returns a single YouTube iFrame Player API instance
     * @private
     */
    async _buildPlayer () {
        let instance = players.get(this) || {};

        if (instance.ytPlayer) {
            return Promise.resolve(instance.ytPlayer);
        }
        let id = 'vplayer' + instance.id;
        // create youtube element
        let ytEl = this.createPlayerElement();
        ytEl.setAttribute('id', id);
        instance.container.appendChild(ytEl);
        this.videoId = this.getVideoId(this.sourceUrl);
        return new Promise((resolve) => {
            instance.ytPlayer = new YT.Player(ytEl, {
                height: this.options.height,
                width: this.options.width,
                playerVars: instance.playerVars,
                videoId: this.videoId,
                events: {
                    onReady: (e) => {
                        this.el.dispatchEvent(new CustomEvent('canplay'));
                        this._resolveBuildPlayerPromise = resolve;
                        resolve(e.target);
                    },
                    onStateChange: (obj) => {
                        this._onYTApiStateChange(obj);
                    }
                }
            });
        });
    }

    createPlayerElement() {
        return document.createElement('div');
    }

    /**
     * When the video starts playing.
     * @private
     */
    _onPlay () {
        let instance = players.get(this);
        players.forEach((playerInstance) => {
            // state of 1 means a video is currently playing
            if (playerInstance !== instance && playerInstance.ytPlayer.getPlayerState() === 1) {
                const videoElement = playerInstance.container.querySelector('video');
                videoElement.pause();
            }
        });
        // add class so things like play button image,
        // thumbnail/poster image, etc can be manipulated if needed
        instance.container.classList.add(this.options.playingCssClass);
        this.el.dispatchEvent(new CustomEvent('play'));
        // TODO: pause all other youtube videos from playing!
    }

    /**
     * When the video is paused.
     * @private
     */
    _onPause () {
        let container = players.get(this).container;
        container.classList.remove(this.options.playingCssClass);
    }

    /**
     * When the video has finished playing.
     * @private
     */
    _onEnd () {
        let container = players.get(this).container;
        container.classList.remove(this.options.playingCssClass);
    }

    /**
     * When the video's state changes via the Youtube API.
     * @param {Object} obj - Youtube's data object
     * @param {Number} obj.data - The number representing the state of the video
     * @private
     */
    _onYTApiStateChange (obj) {
        let stateMap = {
            '-1': 'unstarted',
            '0': 'ended',
            '1': 'playing',
            '2': 'pause',
            '3': 'buffering',
            '5': 'cued'
        };
        let state = stateMap[obj.data.toString()];
        if (eventMethodMap[state]) {
            let method = eventMethodMap[state];
            if (method) {
                method.call(this);
                // TODO: trigger 'play' MediaEvent if the video has been paused at least once
                this.el.dispatchEvent(new CustomEvent(state));
            }
        }
    }

    /**
     * Destroys the video instance.
     */
    destroy () {
        let instance = players.get(this);
        let container = instance.container;
        let origParent = instance.origParent;
        // just in case destroy is called before youtube script callback happens
        if (container) {
            container.classList.remove(this.options.loadingCssClass);
        }


        // remove from cache
        players.delete(this);

        if (!players.size) {
            players.clear();
            videoCount = 0;
            this._unloadScript();
        }


        eventMethodMap = {};

        if (this._resolveBuildPlayerPromise) {
            this._resolveBuildPlayerPromise();
        }

        // get rid of container and place video element back in the dom exactly the way we found it
        if (origParent && origParent.contains(container)) {
            origParent.replaceChild(this.el, container);
        }
    }
}

export default YoutubeVideo;
