/** 
* ElementKit - v0.1.3.
* https://github.com/mkay581/element-kit.git
* Copyright 2014 Mark Kennedy. Licensed MIT.
*/
(function (factory) {
    'use strict';
    // support both AMD and non-AMD
    if (typeof define === 'function' && define.amd) {
        define(['exports'], function () {
            return factory();
        });
    } else {
        factory();
    }
})((function () {
    'use strict';
    /**
     * Creates an HTML Element from an html string.
     * @param {string} html - String of html
     * @returns {HTMLElement} - Returns and html element node
     */
    function createHtmlElement(html) {
        var tempParentEl,
            el;
        if (html) {
            html = html.trim(html);
            tempParentEl = document.createElement('div');
            tempParentEl.innerHTML = html;
            el = tempParentEl.childNodes[0];
            return tempParentEl.removeChild(el);
        }
    }

    /**
     * Merges the contents of two or more objects.
     * @param {object} obj - The target object
     * @param {...object} - Additional objects who's properties will be merged in
     */
    function extend(target) {
        var merged = target,
            source, i;
        for (i = 1; i < arguments.length; i++) {
            source = arguments[i];
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    merged[prop] = source[prop];
                }
            }
        }
        return merged;
    }

    var count = 0, cache = {};

    var Kit = function (el) {
        this.el = el;
        this.classList = this._getClassList();
        this._eventListenerMap = this._eventListenerMap || [];

        Object.defineProperty(this, 'dataset', {
            get: function () {
                return this.getData();
            }.bind(this)
        })
    };

    /**
     * A class from which all Elements are based.
     * @description Bootstraps an element to allow for native JS methods (see https://developer.mozilla.org/en-US/docs/Web/API/Element)
     * @class Kit
     * @param {Element} el - The element
     */
    Kit.prototype = /** @lends Element */{

        /**
         * Wrap a parent container element around the element.
         * @param {string} html - The wrapper html
         */
        appendOuterHtml: function (html) {
            var origContainer = this.el.parentNode,
                container = createHtmlElement(html);
            origContainer.replaceChild(container, this.el);
            container.appendChild(this.el);
            return container;
        },

        /**
         * Retrieves the unique identifier of the element.
         * @private
         */
        getUniqueId: function () {
            return this.el._kitId;
        },

        /**
         * Gets the closest ancestor element that has a css class.
         * @param {string} className - The class name that the ancestor must have to match
         */
        getClosestAncestorElementByClassName: function (className) {
            var result,
                parentNode = this.el.parentNode;
            // we must check if the node has classname property because some don't (#document element)
            while (parentNode && typeof parentNode.className === 'string') {
                if (parentNode.kit._hasClass(className)) {
                    result = parentNode;
                    break;
                } else {
                    parentNode = parentNode.parentNode;
                }
            }
            return result;
        },

        /**
         * Adds an event listener to the element.
         * @param {string} event - The event to listen to
         * @param {string|Function} listener - The name of the function (or the function itself) that should fire when the event happens
         * @param {Object} [context] - The context in which the function should be called
         * @param {Object} [options] - Object containing additional options
         * @param {Object} [options.useCapture] - Whether to use capture (see Web.API.EventTarget.addEventListener)
         */
        addEventListener: function (event, listener, context, options) {
            var _listener = listener;
            options = options || {};

            if (typeof _listener !== 'function') {
                _listener = this._createEventListener(context[listener], context);
            }

            this.el.addEventListener(event, _listener, options.useCapture);

            this._eventListenerMap.push({
                event: event,
                listener: _listener,
                listenerId: listener,
                context: context
            });
        },

        /**
         * Creates an event listener bounded to a context (useful for adding and removing events).
         * @param {Function} listener - The listener function
         * @param {Object} context - The context that should be used when the function is called
         * @returns {Function} Returns an event listener function bounded to the context
         * @private
         */
        _createEventListener: function (listener, context) {
            return function (e) {
                context = context || this;
                listener.apply(context, arguments);
            }
        },

        /**
         * Removes an event listener from the element.
         * @param {string} event - The event to remove
         * @param {string|Function} listener - The event listener function or (name of it) to be removed
         * @param {Object} [context] - The context of the listener that is being removed
         */
        removeEventListener: function (event, listener, context) {
            var map = this._eventListenerMap || [],
                i,
                obj;

            if (map.length) {
                for (i = 0; i < map.length; i++) {
                    obj = map[i];
                    if (obj && obj.event === event && obj.listenerId === listener && obj.context === context) {
                        this.el.removeEventListener(event, obj.listener);
                        this._eventListenerMap[i] = null;
                        break;
                    }
                }
            }
        },

        /**
         * Builds a transition promise that waits to resolve until the el's CSS transition is completed.
         * @param {Function} callback - The callback that is fired when the transition time is complete
         * @returns {HTMLElement} Returns the html element
         */
        waitForTransition: function (callback) {
            var duration = this.getTransitionDuration();
            if (callback) {
                if (duration > 0) {
                    setTimeout(callback.bind(this, this.el), duration);
                } else {
                    callback(this.el);
                }
            }
        },

        /**
         * Gets the time is takes for the element to transition to its show state.
         * @returns {Number} Returns the total CSS transition time in milliseconds
         */
        getTransitionDuration: function () {
            var delay = this.getCssComputedProperty('transition-delay') || '0ms',
                duration = this.getCssComputedProperty('transition-duration') || '0ms';
            delay = this._convertCssTimeValueToMilliseconds(delay);
            duration = this._convertCssTimeValueToMilliseconds(duration);
            return delay + duration;
        },

        /**
         * Gets the computed property of the element.
         * @param {string} prop - The name of the property to get
         * @returns {string} Returns the value of the property
         */
        getCssComputedProperty: function (prop) {
            var style = window.getComputedStyle(this.el);
            return style.getPropertyValue(prop) || this.el.style[this._getJsPropName(prop)];
        },

        /**
         * Converts a css timing unit value into milliseconds.
         * @param {string} val - The value string
         * @returns {Number} Returns the number of milliseconds
         * @private
         */
        _convertCssTimeValueToMilliseconds: function (val) {
            var number = this._convertCssUnitToNumber(val),
                unit = val.replace(number, '');
            if (unit === 's') {
                val = number * 1000;
            } else {
                val = number;
            }
            return val;
        },

        /**
         * Removes the unit (px, ms, etc) from a css value and converts it to a number.
         * @param {string} val - The css value
         * @returns {Number} Returns the number with the css value unit removed
         * @private
         */
        _convertCssUnitToNumber: function (val) {
            return Number(val.replace(/[a-z]+/, ''));
        },

        /**
         * Gets the class list of an element.
         * @returns {Array} Returns an array of class names.
         * @private
         */
        _getClassList: function () {
            return {
                add: this._addClass.bind(this),
                remove: this._removeClass.bind(this),
                contains: this._hasClass.bind(this),
                toggle: this._toggleClass.bind(this)
            };
        },

        /**
         * Gets the class list of an element.
         * @returns {Array} Returns an array of class names.
         * @private
         */
        _getCssClasses: function () {
            return this.el.className.split(' ');
        },

        /**
         * Toggles (adds/removes) a css class on the element.
         * @param {string} className - The css class value to add/remove
         * @private
         */
        _toggleClass: function (className) {
            if (!this._hasClass(className)) {
                this._addClass(className);
            } else {
                this._removeClass(className);
            }
        },

        /**
         * Adds a CSS class to the element.
         * @param {string} className - The css class value to add
         * @private
         */
        _addClass: function  (className) {

            // DOMTokenList does not allow empty strings
            if (!className || this._hasClass(className)) {return;}

            if (this.el.classList) {
                this.el.classList.add(className);
            } else {
                this.el.className = this.el.className + className;
            }
        },

        /**
         * Removes a CSS class from the element.
         * @param {string} className - The css class value to remove
         * @private
         */
        _removeClass: function (className) {

            var re;
            // DOMTokenList does not allow empty strings
            if (!className || !this._hasClass(className)) {return;}

            if (this.el.classList) {
                this.el.classList.remove(className);
            } else {
                if (this.el.className === className) {
                    // if the only class that exists,  remove it and make empty string
                    this.el.className = '';
                } else {
                    re = '[\\s]*' + className;
                    re = new RegExp(re, 'i');
                    this.el.className = this.el.className.replace(re, '');
                }
            }

        },

        /**
         * Checks if the element has a class.
         * @param {string} className - The css class value to check
         * @private
         */
        _hasClass: function (className) {
            var classes = this._getCssClasses();
            return classes.indexOf(className) !== -1;
        },

        /**
         * Takes a css property name and returns the javascript version of it.
         * @param {string} cssProp - The css property
         * @returns {string} Returns the javascript version
         * @private
         */
        _getJsPropName: function (cssProp) {
            // convert to camelCase
            cssProp = cssProp.replace(/-([a-z])/g, function (letter) {
                return letter[1].toUpperCase();
            });
            return cssProp;
        },

        /**
         * Gets a simplified mapping of all attributes of an element.
         * @returns {object} - Returns an object containing all attribute mappings
         */
        getAttributes: function () {
            var attrs = this.el.attributes,
                map = {};
            if (attrs.length) {
                for (var i = 0; i < attrs.length; i++) {
                    map[attrs[i].name] = attrs[i].value;
                }
            }
            return map;
        },

        /**
         * Gets the elements current data attributes that have been assigned in the DOM.
         * @returns {{}}
         * @private
         */
        _getDomData: function () {
            var attrs = this.getAttributes(), data = {}, key, value;
            for (key in attrs) {
                if (attrs.hasOwnProperty(key)) {
                    value = attrs[key];
                    if (key.indexOf('data-') === 0) {
                        // data attribute found!
                        key = key.substr(5);
                        data[key] = value;
                    }
                }
            }
            return data;
        },

        /**
         * Returns an object of the element's current data attributes.
         * @returns {*|{}}
         */
        getData: function () {
            var key;

            this._data = extend({}, this._data, this._getDomData());

            // convert all current data properties to be "watchable".
            for (key in this._data) {
                if (this._data.hasOwnProperty(key)) {
                    var value = this._data[key];
                    // TODO: we should only convert it if it isnt already a "watchable" obj
                    Object.defineProperty(this._data, key, {
                        writeable: true,
                        get: function () {
                            return value;
                        }.bind(this),
                        set: function (value) {
                            this.setData.bind(this, key, value)
                        }.bind(this)
                    });
                }
            }
            return this._data;

        },

        /**
         * When data is being set.
         * @param {string} key - The key of which to be set
         * @param {*} value - The value
         */
        setData: function (key, value) {
            this.el.setAttribute('data-' + key, value);
            this._data[key] = value;

        }
    };

    Object.defineProperty(Element.prototype, 'kit', {
        get: function () {
            if (!cache[this._kitId]) {
                count++;
                this._kitId = count;
                cache[this._kitId] = new Kit(this);
            }

            return cache[this._kitId];
        }
    });

    return Kit;

}));