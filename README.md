[![Build Status](https://travis-ci.org/mkay581/youtube-video-js.svg?branch=master)](https://travis-ci.org/mkay581/youtube-video-js)

# YouTube Video

A lightweight video player that allows you to easily play and control [YouTube](youtube.com) videos using the HTML5
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag and the HTML5
[YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference). Videos can be played, stopped,
paused, and more all with simple html markup or with javascript.

This library aims to mimick the methods and properties of HTML5's `<video>` tag to offer a simple, standardized API
that is easy to use and adheres to the latest video tag specifications. It also supports all major
[Video events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events).

## Usage

You can quickly start using the YouTube Video class as a standalone package, by using one of the [pre-built javascript files](/dist).
Alternatively, you can also use the [source files](/src) directly if you are running your own build processes.

### Setup a Video

Suppose you have the following HTML in the DOM for a YouTube video.

```html
<video width="640" height="360">
    <source type="video/youtube" src="http://www.youtube.com/watch?v=ye82js0sL32" />
</video>
```
### Load and play the video

To start controlling the video with javascript all you need is to pass the `<video>` element into the Youtube Video class.
Once created (instantiated), the instance exposes the [same methods that are available on the new
HTML5 `<video>` element](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video#Controlling_media_playback).

*This example assumes you already have the Video class loaded as a dependency assigned to a `YoutubeVideo` variable.*

```javascript
// start a youtube video
var video = new YoutubeVideo({
    el: document.getElementsByTagName('video')[0]
})

video.load().then(() => {
    video.play();
    video.pause();
});

```

### Listen to the video's events

You can also subscribe to [MediaEvents](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) just as
you would with a `<video>` element.

```javascript
let videoElement = document.getElementsByTagName('video')[0];
let player = new YoutubeVideo({
    el: document.getElementsByTagName('video')[0]
})

videoElement.addEventListener('loadstart', function () {
    // video has started loading!
});

videoElement.load();
```

### Multiple Videos

When dealing with multiple videos that use this library (multiple videos on a single web page for instance),
all other already-playing videos will automatically pause if a video is played. This ensures that no two YouTube videos
will ever be playing at the exact same time, ensuring the best possible experience for your users.

```javascript
let firstVideoElement = document.getElementsByTagName('video')[0];
let firstVideoPlayer = new YoutubeVideo({el: firstVideoElement})

let secondVideoElement = document.getElementsByTagName('video')[1];
let secondVideoPlayer = new YoutubeVideo({el: secondVideoElement})


firstVideoElement.addEventListener('pause', function () {
    // video has been paused because video2 started playing!
});

// load both videos
Promise.all([firstVideoElement.load(), secondVideoElement.load()]
    .then(() => {
       firstVideoElement.play();
    })
    .then(() => {
       // play video2 to trigger pausing of video1
       secondVideoElement.play();
    });

```
## Examples

More code samples can be viewed in the [examples](/examples) folder.

## Development

Run tests:

```
npm install
npm test
```
