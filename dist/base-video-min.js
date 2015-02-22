/** 
* video - v0.2.0.
* https://github.com/mkay581/video.git
* Copyright 2015 Mark Kennedy. Licensed MIT.
*/
"use strict";var _=require("./../libs/underscore/underscore"),BaseVideo=function(){};BaseVideo.prototype={initialize:function(a){var b=a.el||document.createDocumentFragment();this.options=_.extend({el:b,src:b.getAttribute("src"),autoplay:b.getAttribute("autoplay")},a),BaseVideo.prototype.vidCount=BaseVideo.prototype.vidCount||0,BaseVideo.prototype.vidCount++,this.vpid="v"+BaseVideo.prototype.vidCount},addEventListener:function(a,b,c){this.el.addEventListener(a,b,c)},removeEventListener:function(a,b,c){this.el.removeEventListener(a,b,c)},load:function(){this.el.load()},play:function(){this.el.play()},pause:function(){this.el.pause()},destroy:function(){}},window.Video=window.Video||{},module.exports=BaseVideo;