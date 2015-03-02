'use strict';

var utils = require('./utils');
var Element = require('./element');

/**
 * A class from which all image elements are based.
 * @class ImageElement
 * @param {Element} el - The element
 * @todo: find a more simple way to extend Element class along with its prototypes
 */
var ImageElement = function (el) {
    Element.prototype.initialize.call(this, el);
};
ImageElement.prototype = utils.extend({}, Element.prototype, {
    /**
     * Loads the image asset from a provided source url.
     * @param {string} srcAttr - The attribute on the element which has the image source url
     * @param {Function} [callback] - The callback fired when the image has loaded
     */
    load: function (srcAttr, callback) {
        var el = this.el,
            src = el.getAttribute(srcAttr);

        if (!src) {
            console.warn('ElementKit error: ImageElement has no "' + srcAttr + '" attribute to load');
        }

        if (src.indexOf(',') !== -1) {
            // image is a srcset!
            src = this._getImageSourceSetPath(src);
        }
        this._loadImage(src, callback);
        return this;
    },

    /**
     * Loads an image in a virtual DOM which will be cached in the browser and shown.
     * @param {string} src - The image source url
     * @param {Function} callback - Function that is called when image has loaded
     * @param {HTMLImageElement} [el] - Optional image element to load the image onto
     * @returns {string} Returns the image url source
     * @private
     */
    _loadImage: function (src, callback) {
        var img = this.el;
        img.onload = callback || function(){};
        img.src = src;
        return src;
    },

    /**
     * Sniffs srcset attribute and detects the images viewport size to return the correct source image to display
     * FYI: browsers do have this functionality natively but some of them have it turned by default (Firefox, IE, etc)
     * @param {string} srcSet - The source set attribute
     * @returns {string} Returns the source image path
     * @private
     */
    _getImageSourceSetPath: function (srcSet) {
        var viewportWidth = window.innerWidth,
            viewportHeight = window.innerHeight,
            src,
            widthHeightMap,
            width,
            height,
            found;
        srcSet.split(',').forEach(function (str) {
            widthHeightMap = this._buildSourceMapWidthHeight(str);
            width = widthHeightMap.width || 0;
            height = widthHeightMap.height || 0;
            if (!found && viewportWidth >= width && viewportHeight >= height) {
                src = str.split(' ')[0];
                found = true;
            }
        }.bind(this));
        return src;
    },

    /**
     * Builds a mapping of width and height within a srcset attribute.
     * @param {String} str - The srcset attribute string
     * @param {Object} [map] - The object that width and height keys will be attached to
     * @returns {*|{}}
     * @private
     */
    _buildSourceMapWidthHeight: function (str, map) {
        var frags = str.split(' '),
            attrId,
            getNumber = function (frag) {
                return Number(frag.substr(0, frag.length - 1))
            };

        map = map || {};

        frags.shift(); // remove first item since we know it is the filename

        frags.forEach(function (frag) {
            attrId = frag.charAt(frag.length - 1);
            if (attrId === 'w') {
                map.width = getNumber(frag);
            } else if (attrId === 'h') {
                map.height = getNumber(frag);
            }
        });
        return map;
    }

});

module.exports = ImageElement;