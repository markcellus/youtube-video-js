/*!
 * Youtube-video-js v3.1.0
 * https://github.com/mkay581/youtube-video-js#readme
 *
 * Copyright (c) 2019 Mark Kennedy
 * Licensed under the MIT license
 */

/**
 * Makes sure that a path is converted to an array.
 * @param paths
 * @returns {*}
 */
let ensurePathArray = function (paths) {
    if (!paths) {
        paths = [];
    } else if (typeof paths === 'string') {
        paths = [paths];
    }
    return paths;
};

/**
 The Resource Manager.
 @class ResourceManager
 @description Represents a manager that loads any CSS and Javascript Resources on the fly.
 */
class ResourceManager {

    /**
     * Upon initialization.
     * @memberOf ResourceManager
     */
    constructor () {
        this._head = document.getElementsByTagName('head')[0];
        this._cssPaths = {};
        this._scriptMaps = {};
        this._dataPromises = {};
    }

    /**
     * Loads a javascript file.
     * @param {string|Array} paths - The path to the view's js file
     * @memberOf ResourceManager
     * @return {Promise} Returns a promise that resolves when all scripts have been loaded
     */
    async loadScript (paths) {
        let script,
            map,
            loadPromises = [];
        paths = ensurePathArray(paths);
        paths.forEach((path) => {
            map = this._scriptMaps[path] = this._scriptMaps[path] || {};
            if (!map.promise) {
                map.path = path;
                map.promise = new Promise((resolve) => {
                    script = this.createScriptElement();
                    script.setAttribute('type','text/javascript');
                    script.src = path;
                    script.addEventListener('load', resolve);
                    this._head.appendChild(script);
                });
            }
            loadPromises.push(map.promise);
        });
        return Promise.all(loadPromises);
    }

    /**
     * Removes a script that has the specified path from the head of the document.
     * @param {string|Array} paths - The paths of the scripts to unload
     * @memberOf ResourceManager
     */
    async unloadScript (paths) {
        let file;
        return new Promise((resolve) => {
            paths = ensurePathArray(paths);
            paths.forEach((path) => {
                file = this._head.querySelectorAll('script[src="' + path + '"]')[0];
                if (file) {
                    this._head.removeChild(file);
                    delete this._scriptMaps[path];
                }
            });
            resolve();
        });
    }

    /**
     * Creates a new script element.
     * @returns {HTMLElement}
     */
    createScriptElement () {
        return document.createElement('script');
    }

    /**
     * Makes a request to get data and caches it.
     * @param {string} url - The url to fetch data from
     * @param [reqOptions] - options to be passed to fetch call
     * @returns {*}
     */
    async fetchData (url, reqOptions = {}) {
        let cacheId = url + JSON.stringify(reqOptions);

        reqOptions.cache = reqOptions.cache === undefined ? true : reqOptions.cache;

        if (!url) {
            return Promise.resolve();
        }
        if (!this._dataPromises[cacheId] || !reqOptions.cache) {
            try {
                this._dataPromises[cacheId] = await fetch(url, reqOptions);
            } catch (e) {
                // if failure, remove cache so that subsequent
                // requests will trigger new ajax call
                this._dataPromises[cacheId] = null;
                throw e;
            }
        }
        return this._dataPromises[cacheId];
    }

    /**
     * Loads css files.
     * @param {Array|String} paths - An array of css paths files to load
     * @memberOf ResourceManager
     * @return {Promise}
     */
    async loadCss (paths) {
        return new Promise((resolve) => {
            paths = ensurePathArray(paths);
            paths.forEach((path) => {
                // TODO: figure out a way to find out when css is guaranteed to be loaded,
                // and make this return a truely asynchronous promise
                if (!this._cssPaths[path]) {
                    let el = document.createElement('link');
                    el.setAttribute('rel','stylesheet');
                    el.setAttribute('href', path);
                    this._head.appendChild(el);
                    this._cssPaths[path] = el;
                }
            });
            resolve();
        });
    }

    /**
     * Unloads css paths.
     * @param {string|Array} paths - The css paths to unload
     * @memberOf ResourceManager
     * @return {Promise}
     */
    async unloadCss (paths) {
        let el;
        return new Promise((resolve) => {
            paths = ensurePathArray(paths);
            paths.forEach((path) => {
                el = this._cssPaths[path];
                if (el) {
                    this._head.removeChild(el);
                    this._cssPaths[path] = null;
                }
            });
            resolve();
        });
    }

    /**
     * Parses a template into a DOM element, then returns element back to you.
     * @param {string} path - The path to the template
     * @param {HTMLElement} [el] - The element to attach template to
     * @returns {Promise} Returns a promise that resolves with contents of template file
     */
    async loadTemplate (path, el) {
        if (!path) {
            return Promise.resolve();
        }
        const contents = await this.fetchTemplate(path);
        if (el) {
            el.innerHTML = contents;
            return el;
        }
        return contents;

    }

    /**
     * Fetches a template file from the server.
     * @param [templatePath] - The file path to the template file
     * @returns {Promise} Returns a promise that is resolved with the contents of the template file when retrieved
     */
    async fetchTemplate(templatePath) {
        const resp = await fetch(templatePath);
        return await resp.text();
    }

    /**
     * Removes all cached resources.
     * @memberOf ResourceManager
     */
    async flush () {
        await this.unloadCss(Object.getOwnPropertyNames(this._cssPaths));
        this._cssPaths = {};
        for (let s in this._scriptMaps) {
            if (this._scriptMaps.hasOwnProperty(s)) {
                let map = this._scriptMaps[s];
                await this.unloadScript(map.path);
            }
        }
        this._scriptMaps = {};
        this._dataPromises = {};
    }

}
const resourceManager = new ResourceManager();

const videos = new Map();
class YoutubeVideoElement extends HTMLElement {
    constructor() {
        super();
        this.paused = true;
        this.ytPlayerContainer = undefined;
        this.resolveBuildPlayerPromise = null;
        this.ytPlayerPromise = null;
        this.scriptPath = 'https://www.youtube.com/iframe_api';
        this.mediaError = undefined;
        videos.set(this, this.id);
    }
    connectedCallback() {
        this.ytPlayerContainer = this.createYTPlayerElement();
        this.appendChild(this.ytPlayerContainer);
        this.ytPlayerContainer.style.display = 'block'; // to adhere to shape of youtube's generated iframe
        this.load();
    }
    disconnectedCallback() {
        videos.delete(this);
        if (this.resolveBuildPlayerPromise) {
            this.resolveBuildPlayerPromise();
        }
        if (this.ytPlayer) {
            this.ytPlayer.destroy();
        }
        if (!videos.size) {
            videos.clear();
            this.unloadYTScript();
        }
    }
    get height() {
        return Number(this.getAttribute('height'));
    }
    get width() {
        return Number(this.getAttribute('width'));
    }
    get src() {
        return this.getAttribute('src');
    }
    get autoplay() {
        return Boolean(this.getAttribute('autoplay'));
    }
    get playsinline() {
        return Boolean(this.getAttribute('playsinline'));
    }
    get id() {
        return this.getAttribute('id') || `ytPlayer-${videos.size}`;
    }
    get controls() {
        return Boolean(this.getAttribute('controls'));
    }
    get ytPlayerVars() {
        const { srcQueryParams } = this;
        srcQueryParams.autoplay = this.autoplay ? 1 : 0;
        srcQueryParams.controls = this.controls ? 1 : 0;
        srcQueryParams.playsinline = this.playsinline ? 1 : 0;
        return srcQueryParams;
    }
    get srcQueryParams() {
        const queryString = this.src.split('?')[1] || '';
        if (!queryString) {
            return {};
        }
        const a = queryString.split('&');
        const params = {};
        for (const item of a) {
            const p = item.split('=', 2);
            if (p.length === 1) {
                params[p[0]] = '';
            }
            else {
                params[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
            }
        }
        return params;
    }
    async load() {
        await this.loadYTScript();
        this.ytPlayer = await this.buildPlayer();
        return this.ytPlayer;
    }
    get videoId() {
        const re = new RegExp(`https?:\\/\\/(?:[0-9A-Z-]+\\.)?(?:youtu\\.be\\/|youtube(?:-nocookie)?\\.com\\S*[^\\w\\s-])([\\w-]{11})(?=[^\\w-]|$)(?![?=&+%\\w.-]*(?:['"][^<>]*>|<\\/a>))[?=&+%\\w.-]*`, 'ig');
        return this.src.replace(re, '$1');
    }
    play() {
        this.paused = false;
        if (!this.src) {
            this.error = new Error(`you cannot call play() method on a video element that has no youtube source url`);
        }
        else if (this.ytPlayer) {
            this.ytPlayer.playVideo();
        }
    }
    pause() {
        if (this.ytPlayer) {
            this.ytPlayer.pauseVideo();
        }
    }
    createYTPlayerElement() {
        return document.createElement('div');
    }
    onPlay() {
        this.paused = false;
        // pause all other youtube videos from playing!
        videos.forEach((id, video) => {
            if (video !== this && !video.paused) {
                video.pause();
            }
        });
        this.dispatchEvent(new CustomEvent('play'));
    }
    onPause() {
        this.paused = true;
    }
    onEnd() {
        this.paused = true;
    }
    set error(error) {
        const { message } = error;
        this.dispatchEvent(new ErrorEvent(message));
        this.mediaError = error;
        throw error;
    }
    get error() {
        return this.mediaError;
    }
    _onYTApiStateChange(obj) {
        const stateMap = {
            '-1': 'unstarted',
            '0': 'ended',
            '1': 'playing',
            '2': 'pause',
            '3': 'buffering',
            '5': 'cued',
        };
        const state = stateMap[obj.data.toString()];
        // trigger our internal event handling method
        // whenever the youtube api player triggers an event
        const eventMethodMap = {
            ended: this.onEnd,
            pause: this.onPause,
            playing: this.onPlay,
        };
        if (eventMethodMap[state]) {
            const method = eventMethodMap[state];
            if (method) {
                method.call(this);
                // TODO: trigger 'play' MediaEvent if the video has been paused at least once
                this.dispatchEvent(new CustomEvent(state));
            }
        }
    }
    loadYTScript() {
        // Load the IFrame Player API code asynchronously.
        if (!YoutubeVideoElement.scriptLoadPromise) {
            YoutubeVideoElement.scriptLoadPromise = new Promise(resolve => {
                // NOTE: youtube's iframe api ready only fires once after first script load
                if (!window.onYouTubeIframeAPIReady) {
                    YoutubeVideoElement.triggerYoutubeIframeAPIReady = resolve;
                    window.onYouTubeIframeAPIReady = () => {
                        window.onYouTubeIframeAPIReady = null;
                        // once the script loads once, we are guaranteed for it to
                        // be ready even after destruction of all instances (if consumer
                        // doesnt mangle with it)
                        YoutubeVideoElement.triggerYoutubeIframeAPIReady();
                    };
                }
                return resourceManager.loadScript(this.scriptPath);
            });
        }
        return YoutubeVideoElement.scriptLoadPromise;
    }
    unloadYTScript() {
        resourceManager.unloadScript(this.scriptPath);
        YoutubeVideoElement.scriptLoadPromise = null;
    }
    buildPlayer() {
        if (this.ytPlayerPromise) {
            return this.ytPlayerPromise;
        }
        this.ytPlayerPromise = new Promise(resolve => {
            const playerOptions = {
                events: {
                    onError: () => {
                        this.error = new Error('player could not be built');
                    },
                    onReady: (e) => {
                        this.dispatchEvent(new CustomEvent('loadstart'));
                        this.dispatchEvent(new CustomEvent('canplay'));
                        this.resolveBuildPlayerPromise = resolve;
                        resolve(e.target);
                    },
                    onStateChange: (obj) => this._onYTApiStateChange(obj),
                },
                height: this.height,
                playerVars: this.ytPlayerVars,
                videoId: this.videoId,
                width: this.width,
            };
            this.ytPlayer = new YT.Player(
            // @ts-ignore
            this.ytPlayerContainer, playerOptions);
        });
        return this.ytPlayerPromise;
    }
}
YoutubeVideoElement.scriptLoadPromise = null;
YoutubeVideoElement.triggerYoutubeIframeAPIReady = null;
customElements.define('youtube-video', YoutubeVideoElement);

export { YoutubeVideoElement };
