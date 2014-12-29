define(function () {

    // add polyfill for Function.bind for phantomJS (running tests headlessly)
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== 'function') {
                // closest thing possible to the ECMAScript 5
                // internal IsCallable function
                throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP && oThis
                            ? this
                            : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    var TestUtils = {

        /**
         * Creates an event.
         * @param {string} name - The event name
         * @param {object} [options] - Options to be passed to event
         */
        createEvent: function (name, options) {
            var event;
            options = options || {};
            options.bubbles = options.bubbles || false;
            options.cancelable = options.cancelable|| false;

            event = document.createEvent('CustomEvent');
            event.initCustomEvent(name, options.bubbles, options.cancelable, null);
            return event;
        },

        /**
         * Creates an HTML Element from an html string.
         * @param {string} html - String of html
         * @returns {HTMLElement} - Returns and html element node
         */
        createHtmlElement: function (html) {
            var tempParentEl,
                el;
            if (html) {
                html = this.trim(html);
                tempParentEl = document.createElement('div');
                tempParentEl.innerHTML = html;
                el = tempParentEl.childNodes[0];
                return tempParentEl.removeChild(el);
            }
        },

        /**
         * Zaps whitespace from both ends of a string.
         * @param {string} val - The string value to trim
         * @returns {string} Returns a trimmed string
         */
        trim: function (val) {
            if (!String.prototype.trim) {
                String.prototype.trim = function () {
                    return val.replace(/^\s+|\s+$/g, '');
                };
            } else {
                val = val.trim();
            }
            return val;
        }

    };

    return TestUtils;

});
