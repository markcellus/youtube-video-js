#Video Player

A lightweight framework that allows you to easily play and control social network videos using the new HTML5 `<video>` tag. Videos
can be played, stopped, paused, and more all with simple html markup or with javascript. It does not depend on a css stylesheet,
although if styles are desired they are left up to you.

The library supports [Youtube](youtube.com) videos currently. More players will be added in the next few weeks.


##Usage

Suppose you have the following HTML in the DOM.

```html
<video width="640" height="360">
    <source type="video/youtube" src="http://www.youtube.com/watch?v=ye82js0sL32" />
</video>
```

To control the video with javascript all you need to do is the following:

```javascript
require(['path/to/video-player/file'], function (VideoPlayer) {
    var videoEl = document.getElementsByTagName('video')[0];

    // start a youtube video
    var player = new VideoPlayer.Youtube({
        el: videoEl
    });

    // load the video
    player.load(function () {

        // play the video
        player.play();

        // stop the video
        player.stop();

    });
});
```




