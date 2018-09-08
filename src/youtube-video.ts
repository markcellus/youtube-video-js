import ResourceManager from 'resource-manager-js';

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}

const videos: Map<YoutubeVideoElement, string> = new Map();

export class YoutubeVideoElement extends HTMLElement {
    private static scriptLoadPromise: Promise<void> = null;
    private static triggerYoutubeIframeAPIReady: () => void = null;

    ytPlayer: YT.Player;
    paused: boolean = true;
    ytPlayerContainer: HTMLElement = undefined;

    private resolveBuildPlayerPromise: () => void = null;
    private ytPlayerPromise: Promise<YT.Player> = null;
    private scriptPath: string = 'https://www.youtube.com/iframe_api';
    private mediaError: Error = undefined;

    constructor() {
        super();
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

    get height(): number {
        return Number(this.getAttribute('height'))
    }
    get width(): number {
        return Number(this.getAttribute('width'))
    }

    get src(): string {
        return this.getAttribute('src');
    }

    get autoplay(): boolean {
        return Boolean(this.getAttribute('autoplay'));
    };

    get id(): string {
        return this.getAttribute('id') || `ytPlayer-${videos.size}`;
    }

    get controls(): boolean {
        return Boolean(this.getAttribute('controls'));
    }

    get ytPlayerVars(): YT.PlayerVars {
        const {srcQueryParams} = this;
        srcQueryParams.autoplay = this.autoplay ? 1 : 0;
        srcQueryParams.controls = this.controls ? 1 : 0;
        return srcQueryParams;
    };

    get srcQueryParams(): YT.PlayerVars {
        const queryString = this.src.split('?')[1] || '';
        if (!queryString) { return {}; }
        const a = queryString.split('&');
        const params: YT.PlayerVars = {};
        for (const item of a) {
            const p = item.split('=', 2);
            if (p.length === 1) {
                params[p[0]] = '';
            } else {
                params[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
            }
        }
        return params;
    }

    async load(): Promise<YT.Player> {
        await this.loadYTScript();
        this.ytPlayer = await this.buildPlayer();
        return this.ytPlayer;
    }

    get videoId(): number | string {
        const re = new RegExp(`https?:\\/\\/(?:[0-9A-Z-]+\\.)?(?:youtu\\.be\\/|youtube(?:-nocookie)?\\.com\\S*[^\\w\\s-])([\\w-]{11})(?=[^\\w-]|$)(?![?=&+%\\w.-]*(?:['"][^<>]*>|<\\/a>))[?=&+%\\w.-]*`, 'ig');
        return this.src.replace(re, '$1');
    }

    play() {
        this.paused = false;
        if (!this.src) {
            this.error = new Error(`you cannot call play() method on a video element that has no youtube source url`);
        } else if (this.ytPlayer) {
            this.ytPlayer.playVideo();
        }
    }

    pause() {
        if (this.ytPlayer) {
            this.ytPlayer.pauseVideo()
        }
    }

    createYTPlayerElement() {
        return document.createElement('div');
    }

    private onPlay() {
        this.paused = false;
        // pause all other youtube videos from playing!
        videos.forEach((id, video) => {
            if (video !== this && !video.paused) {
                video.pause();
            }
        });
        this.dispatchEvent(new CustomEvent('play'));
    }

    private onPause() {
        this.paused = true;
    }

    private onEnd() {
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

    private _onYTApiStateChange(obj: YT.OnStateChangeEvent) {
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

    private loadYTScript(): Promise<void> {
        // Load the IFrame Player API code asynchronously.
        if (!YoutubeVideoElement.scriptLoadPromise) {
            YoutubeVideoElement.scriptLoadPromise = new Promise((resolve) => {
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
                return ResourceManager.loadScript(this.scriptPath);
            });
        }
        return YoutubeVideoElement.scriptLoadPromise;
    }

    private unloadYTScript() {
        ResourceManager.unloadScript(this.scriptPath);
        YoutubeVideoElement.scriptLoadPromise = null;
    }

    private buildPlayer(): Promise<YT.Player> {
        if (this.ytPlayerPromise) {
            return this.ytPlayerPromise;
        }
        this.ytPlayerPromise = new Promise((resolve) => {
            const playerOptions = {
                events: {
                    onError: (e: YT.OnErrorEvent) => {
                        this.error = new Error('player could not be built');
                    },
                    onReady: (e: YT.PlayerEvent) => {
                        this.dispatchEvent(new CustomEvent('loadstart'));
                        this.dispatchEvent(new CustomEvent('canplay'));
                        this.resolveBuildPlayerPromise = resolve;
                        resolve(e.target);
                    },
                    onStateChange: (obj: YT.OnStateChangeEvent) => this._onYTApiStateChange(obj),
                },
                height: this.height,
                playerVars: this.ytPlayerVars,
                videoId: this.videoId,
                width: this.width,
            };
            this.ytPlayer = new YT.Player(this.ytPlayerContainer, playerOptions);
        });
        return this.ytPlayerPromise;
    }
}
customElements.define('youtube-video', YoutubeVideoElement);
