[![Build Status](https://travis-ci.org/markcellus/youtube-video-js.svg?branch=master)](https://travis-ci.org/markcellus/youtube-video-js)
[![npm version](https://badge.fury.io/js/youtube-video-js.svg)](https://badge.fury.io/js/youtube-video-js)

# YouTube Video

A `<youtube-video>` web component that allows you to easily play and control YouTube videos, powered by the
[YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference). In addition to simple
rendering, videos can be played, stopped, paused, and more all with simple, native javascript.

This library aims to mimick the methods and properties of HTML5's
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag to offer a simple, standardized API
that is easy to use and adheres to the latest video tag specifications and supports all major
[media events](https://html.spec.whatwg.org/multipage/media.html#mediaevents).

## Installation

```
npm i youtube-video-js
```

Then you can use reference before running your build script

```javascript
import 'youtube-video-js';
```

Or you can load it using the `<script>` tag in your html page

```html
<script
    type="module"
    src="/node_modules/youtube-video-js/dist/youtube-video.js"
></script>
```

## Usage

To render a YouTube video, just declare the component in your HTML. Once created (instantiated), the instance
can be accessed by JavaScript and will have the [same methods that are available on the
HTMLMediaElement](https://html.spec.whatwg.org/multipage/media.html#htmlmediaelement).

**Note: You MUST be requesting a YouTube video from a website that must be either a valid domain or localhost
(NOT an IP address) or video wont work! YouTube's requirement, not mine** :)

```html
<!-- index.html -->
<script
    type="module"
    src="/node_modules/youtube-video-js/dist/youtube-video.js"
></script>
<youtube-video
    width="640"
    height="360"
    src="https://www.youtube.com/watch?v=Wn9twYUXw6w"
    autoplay
    controls
/>

<script>
    const videoElement = document.querySelector('youtube-video');
    // must wait for DOM to be ready and for component to be accessible
    document.addEventListener('DOMContentLoaded', function () {
        // wait for loading
        videoElement.load().then(() => {
            // pause video after two seconds
            const timer = setTimeout(function () {
                videoElement.pause();
                clearTimeout(timer);
            }, 2000);
        });
    });
</script>
```

### Listen to the video's events

You can also subscribe to [MediaEvents](https://www.w3.org/TR/2011/WD-html5-20110113/video.html#mediaevents) just as
you would with a native `<video>` element.

```javascript
const video = document.querySelector('youtube-video');

video.addEventListener('playing', function () {
    // video has started playing!
});

video.addEventListener('pause', function () {
    // video has been paused!
});

video.addEventListener('ended', function () {
    // video has ended!
});

video.addEventListener('loadstart', function () {
    // play video
    video.play();
    // pause video after four seconds
    const timer = setTimeout(function () {
        video.pause();
        clearTimeout(timer);
    }, 4000);
});
```

### Multiple Videos

When dealing with multiple videos that use this library (multiple videos on a single web page for instance),
all other already-playing videos will automatically pause if a video is played. This ensures that no two YouTube videos
will ever be playing at the exact same time, ensuring the best possible experience for your users.

```javascript
const [firstVideoElement, secondVideoElement] = document.querySelectorAll('youtube-video');

firstVideoElement.addEventListener('pause', function () {
    // video has been paused because video2 started playing!
});

// load both videos
Promise.all([firstVideoElement.load(), secondVideoElement.load()]
    .then(() => firstVideoElement.play())
    .then(() => {
       // play video2 to trigger pausing of video1
       secondVideoElement.play();
    });

```

## Extending

You can also extend the youtube video element to create your own custom versions:

```javascript
import { YoutubeVideoElement } from 'youtube-video-js/dist/youtube-video-element.js';
class CustomYoutubeElement extends YoutubeVideoElement {
    // your custom code here
}
customElements.define('custom-youtube-element', CustomYoutubeElement);
```

## Examples

Code samples can be found in the [examples](examples) folder. To run them, pull down this project
and

```bash
npm start
```

## Development

Run tests:

```
npm install
npm test
```
