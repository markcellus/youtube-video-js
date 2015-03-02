module.exports = {
    /**
     * Creates an HTML Element from an html string.
     * @param {string} html - String of html
     * @returns {HTMLElement} - Returns and html element node
     */
    createHtmlElement: function (html) {
        var tempParentEl,
            el;
        if (html) {
            html = html.trim(html);
            tempParentEl = document.createElement('div');
            tempParentEl.innerHTML = html;
            el = tempParentEl.childNodes[0];
            return tempParentEl.removeChild(el);
        }
    },

    /**
     * Merges the contents of two or more objects.
     * @param {object} obj - The target object
     * @param {...object} - Additional objects who's properties will be merged in
     */
    extend: function (target) {
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
};