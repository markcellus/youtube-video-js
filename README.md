[![Build Status](https://travis-ci.org/mkay581/youtube-video-js.svg?branch=master)](https://travis-ci.org/mkay581/youtube-video-js)

# Youtube Video

A lightweight video player that allows you to easily play and control [Youtube](youtube.com) videos with the new HTML5
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag. Videos can be played, stopped,
paused, and more all with simple html markup or with javascript.

This library aims to mimick the methods and properties of HTML5's new `<video>` tag to offer a simple, standardized API
that is easy to use and adheres to the latest video tag specifications.

## Usage

You can quickly start using the Youtube Video class as a standalone package, by using one of the [pre-built javascript files](/dist).
Alternatively, you can also use the [source files](/src) directly if you are running your own build processes.

### Setup a Video

Suppose you have the following HTML in the DOM for a Youtube video.

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

video.load(function () {
    video.play();
    video.pause();
});

```

### Listen to the video's events

You can also subscribe to [MediaEvents](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events) just as you would with a `<video>` element.

```javascript

video.addEventListener('play', function () {
    // video has started!
});

video.addEventListener('ended', function () {
    // video has finished!
});
```


