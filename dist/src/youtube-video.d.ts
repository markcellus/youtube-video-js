/// <reference types="youtube" />
declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
    }
}
export declare class YoutubeVideoElement extends HTMLElement {
    static scriptLoadPromise: Promise<void>;
    static triggerYoutubeIframeAPIReady: () => void;
    ytPlayer: YT.Player;
    paused: boolean;
    ytPlayerContainer: HTMLElement;
    private resolveBuildPlayerPromise;
    private ytPlayerPromise;
    private scriptPath;
    private mediaError;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    readonly height: number;
    readonly width: number;
    readonly src: string;
    readonly autoplay: boolean;
    readonly id: string;
    readonly controls: boolean;
    readonly ytPlayerVars: YT.PlayerVars;
    readonly srcQueryParams: YT.PlayerVars;
    load(): Promise<YT.Player>;
    readonly videoId: string;
    play(): void;
    pause(): void;
    createYTPlayerElement(): HTMLDivElement;
    private onPlay;
    private onPause;
    private onEnd;
    error: any;
    private _onYTApiStateChange;
    private loadYTScript;
    private unloadYTScript;
    private buildPlayer;
}
