[![Build Status](https://travis-ci.org/mkay581/video-js.svg?branch=master)](https://travis-ci.org/mkay581/video-js)

#Video

A lightweight library that allows you to easily play and control social network videos using the new HTML5 [`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) tag. Videos
can be played, stopped, paused, and more all with simple html markup or with javascript.

Supports [Youtube](youtube.com) videos currently. More players will be added soon.

This library aims to mimick the methods and properties of HTML5's new `<video>` tag to offer a simple, easy-to-use API
which can be a lot easier when there are already so many video API's to deal with (i.e. Youtube, Facebook, Vine, Vimeo, etc).


## Dependencies

To use Video class, you'll need:

* [ElementKit](https://github.com/mkay581/element-kit) - Fast DOM manipulation for Elements
* [Underscore](http://underscorejs.org/) - For programming goodies

Of course, if you use [Bower's](http://bower.io/) `bower install` to install this project, it will automatically inject all of the above dependencies for you.

##Usage

### Setup a Youtube Video

Suppose you have the following HTML in the DOM (A Youtube Video).

```html
<video width="640" height="360">
    <source type="video/youtube" src="http://www.youtube.com/watch?v=ye82js0sL32" />
</video>
```
### Load and play the video

To start controlling the video with javascript all you need is one of the [video files](https://github.com/mkay581/video/tree/master/dist)
 and instantiate a new instance, passing it a `<video>` element. Once instantiated, the instance exposes the [same methods that are available on the new
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


