[![Build Status](https://travis-ci.org/mkay581/youtube-video-js.svg?branch=master)](https://travis-ci.org/mkay581/youtube-video-js)
[![npm version](https://badge.fury.io/js/youtube-video-js.svg)](https://badge.fury.io/js/youtube-video-js)

# YouTube Video

A lightweight video player that allows you to easily play and control [YouTube](youtube.com) videos using the HTML5
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag and the HTML5
[YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference). Videos can be played, stopped,
paused, and more all with simple html markup or with javascript.

This library aims to mimick the methods and properties of HTML5's `<video>` tag to offer a simple, standardized API
that is easy to use and adheres to the latest video tag specifications. It also supports all major
[Video events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events).

## Installation

You can install as an npm package if using a build system like [Browserify](http://browserify.org/). 

```
npm install youtube-video-js --save-dev
```

## Usage

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
const videoElement = document.getElementsByTagName('video')[0];
var youtubePlayer = new YoutubeVideo({
    el: videoElement
})

videoElement.load().then(() => {
    videoElement.play();
    videoElement.pause();
});

```

### Listen to the video's events

You can also subscribe to [MediaEvents](https://www.w3.org/TR/2011/WD-html5-20110113/video.html#mediaevents) just as
you would with a `<video>` element.

```javascript
let video = document.getElementsByTagName('video')[0];
let youtubePlayer = new YoutubeVideo({
    el: video
})

video.addEventListener('loadstart', function () {
    // video has started loading!
});
video.load();

video.addEventListener('playing', function () {
    // video has started playing!
});
video.play();

video.addEventListener('pause', function () {
    // video has been paused!
});
video.pause();

video.addEventListener('ended', function () {
    // video has ended!
});

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
