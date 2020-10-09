// CoCreate OverlayScrollbar
var CoCreateOverlayScroll = (function() {
    var _base;
    var _globals;

    var VENDOR = (function () {
        var jsCache = {};
        var cssCache = {};
        var cssPrefixes = ['-webkit-', '-moz-', '-o-', '-ms-'];
        var jsPrefixes = ['WebKit', 'Moz', 'O', 'MS'];
        function firstLetterToUpper(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    
        return {
            _cssPrefixes: cssPrefixes,
            _jsPrefixes: jsPrefixes,
            _cssProperty: function (name) {
                var result = cssCache[name];
    
                if (cssCache.hasOwnProperty(name)) return result;
    
                var uppercasedName = firstLetterToUpper(name);
                var elmStyle = document.createElement('div').style;
                var resultPossibilities;
                var i = 0;
                var v;
                var currVendorWithoutDashes;
    
                for (; i < cssPrefixes.length; i++) {
                    currVendorWithoutDashes = cssPrefixes[i].replace(/-/g, '');
                    resultPossibilities = [ name, cssPrefixes[i] + name, currVendorWithoutDashes + uppercasedName, firstLetterToUpper(currVendorWithoutDashes) + uppercasedName ];
                    for (v = 0; v < resultPossibilities.length; v++) {
                        if (elmStyle[resultPossibilities[v]] !== undefined) {
                            result = resultPossibilities[v];
                            break;
                        }
                    }
                }
    
                cssCache[name] = result;
                return result;
            },
            _jsAPI: function (name, isInterface, fallback) {
                var i = 0;
                var result = jsCache[name];
    
                if (!jsCache.hasOwnProperty(name)) {
                    result = window[name];
                    for (; i < jsPrefixes.length; i++)
                        result = result || window[(isInterface ? jsPrefixes[i] : jsPrefixes[i].toLowerCase()) + firstLetterToUpper(name)];
                    jsCache[name] = result;
                }
                return result || fallback;
            }
        }
    })();
    var COMPAT = (function () {
        function windowSize(x) {
            return x ? window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth : window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        }
        function bind(func, thisObj) {
            if (typeof func != 'function') {
                throw "Can't bind function!";
            }
            var aArgs = Array['prototype'].slice.call(arguments, 2);
            var fNOP = function () { };
            var fBound = function () { return func.apply(this instanceof fNOP ? this : thisObj, aArgs.concat(Array['prototype'].slice.call(arguments))); };
    
            if (func['prototype']) fNOP['prototype'] = func['prototype']; 
            fBound['prototype'] = new fNOP();
    
            return fBound;
        }
    
        return {
            wW: bind(windowSize, 0, true),
            wH: bind(windowSize, 0),
            rAF: bind(VENDOR._jsAPI, 0, 'requestAnimationFrame', false, function (func) { return window.setTimeout(func, 1000 / 60); }),
            stpP: function (event) {
                if (event.stopPropagation) event.stopPropagation();
                else event.cancelBubble = true;
            },
            prvD: function (event) {
                if (event.preventDefault && event.cancelable) event.preventDefault();
                else event.returnValue = false;
            },
            page: function (event) {
                event = event.originalEvent || event;
    
                var strPage = 'page';
                var strClient = 'client';
                var strX = 'X';
                var strY = 'Y';
                var target = event.target || event.srcElement || document;
                var eventDoc = target.ownerDocument || document;
                var doc = eventDoc.documentElement;
                var body = eventDoc.body;
    
                if (event.touches !== undefined) {
                    var touch = event.touches[0];
                    return {
                        x: touch[strPage + strX],
                        y: touch[strPage + strY]
                    }
                }
    
                if (!event[strPage + strX] && event[strClient + strX] && event[strClient + strX] != null) {
    
                    return {
                        x: event[strClient + strX] +
                            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                            (doc && doc.clientLeft || body && body.clientLeft || 0),
                        y: event[strClient + strY] +
                            (doc && doc.scrollTop || body && body.scrollTop || 0) -
                            (doc && doc.clientTop || body && body.clientTop || 0)
                    }
                }
                return {
                    x: event[strPage + strX],
                    y: event[strPage + strY]
                };
            },
            mBtn: function (event) {
                var button = event.button;
                if (!event.which && button !== undefined) return (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
                else return event.which;
            },
            inA: function (item, arr) {
                for (var i = 0; i < arr.length; i++)
                    try {
                        if (arr[i] === item) return i;
                    }
                    catch (e) { }
                return -1;
            },
            isA: function (arr) {
                var def = Array.isArray;
                return def ? def(arr) : this.type(arr) == 'array';
            },
            type: function (obj) {
                if (obj === undefined) return obj + '';
                if (obj === null) return obj + '';
                return Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, '$1').toLowerCase();
            },
    
            bind: bind
        }
    })();

    var Utils = (function () {
        var _rnothtmlwhite = (/[^\x20\t\r\n\f]+/g);
        var _type = COMPAT.type;
        var _cssNumber = {
            animationIterationCount: true,
            columnCount: true,
            fillOpacity: true,
            flexGrow: true,
            flexShrink: true,
            fontWeight: true,
            lineHeight: true,
            opacity: true,
            order: true,
            orphans: true,
            widows: true,
            zIndex: true,
            zoom: true
        };
    
        function extend() {
            var src, copyIsArray, copy, name, options, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
            if (_type(target) == 'boolean') {
                deep = target;
                target = arguments[1] || {};
                i = 2;
            }
            if (_type(target) != 'object' && !_type(target) == 'function') {
                target = {};
            }
            if (length === i) {
                target = FakejQuery;
                --i;
            }
            for (; i < length; i++) {
                if ((options = arguments[i]) != null) {
                    for (name in options) {
                        src = target[name];
                        copy = options[name];
    
                        if (target === copy) continue;
                        if (deep && copy && (isPlainObject(copy) || (copyIsArray = COMPAT.isA(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && COMPAT.isA(src) ? src : [];
                            } else {
                                clone = src && isPlainObject(src) ? src : {};
                            }
                            target[name] = extend(deep, clone, copy);
                        } else if (copy !== undefined) {
                            target[name] = copy;
                        }
                    }
                }
            }
    
            return target;
        };
    
        function inArray(item, arr, fromIndex) {
            for (var i = fromIndex || 0; i < arr.length; i++)
                if (arr[i] === item) return i;
            return -1;
        }
        function isSubstr(str, sub) {
            if(str.indexOf(sub) > -1) return true;
            return false;
        }
        function isFunction(obj) {
            return _type(obj) == 'function';
        };
        function isEmptyObject(obj) {
            for (var name in obj) 
                if(obj.hasOwnProperty(name)) return false;
            return true;
        };
        function isPlainObject(obj) {
            if (!obj || _type(obj) != 'object') return false;
    
            var key;
            var proto = 'prototype';
            var hasOwnProperty = Object[proto].hasOwnProperty;
            var hasOwnConstructor = hasOwnProperty.call(obj, 'constructor');
            var hasIsPrototypeOf = obj.constructor && obj.constructor[proto] && hasOwnProperty.call(obj.constructor[proto], 'isPrototypeOf');
    
            if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) return false;
            for (key in obj) { /**/ }
            return _type(key) == 'undefined' || hasOwnProperty.call(obj, key);
        };
        function each(obj, callback) {
            var i = 0;
            if (isArrayLike(obj)) {
                for (; i < obj.length; i++) {
                    if (callback.call(obj[i], i, obj[i]) === false) break;
                }
            } else {
                for (i in obj) {
                    if (callback.call(obj[i], i, obj[i]) === false) break;
                }
            }
            return obj;
        };
        function isArrayLike(obj) {
            var length = !!obj && 'length' in obj && obj.length;
            var t = _type(obj);
            return isFunction(t) ? false : (t == 'array' || length === 0 || _type(length) == 'number' && length > 0 && (length - 1) in obj);
        }
        function stripAndCollapse(value) {
            var tokens = value.match(_rnothtmlwhite) || [];
            return tokens.join(' ');
        }
        function matches(elem, selector) {
            var nodeList = (elem.parentNode || document).querySelectorAll(selector) || [];
            var i = nodeList.length;
            while (i--)
                if (nodeList[i] == elem) return true;
            return false;
        }
        function insertAdjacentElement(el, strategy, child) {
            if (COMPAT.isA(child)) {
                for (var i = 0; i < child.length; i++) insertAdjacentElement(el, strategy, child[i]);
            } else if (_type(child) == 'string') el.insertAdjacentHTML(strategy, child);
            else el.insertAdjacentElement(strategy, child.nodeType ? child : child[0]);
        }
        function setCSSVal(el, prop, val) {
            try {
                if (el.style[prop] !== undefined) el.style[prop] = parseCSSVal(prop, val);
            } catch (e) { }
        }
        function parseCSSVal(prop, val) {
            if (!_cssNumber[prop.toLowerCase()] && _type(val) == 'number') val += 'px';
            return val;
        }
        function elementIsVisible(el) {
            return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        }
    
        function FakejQuery(selector) {
            if (arguments.length === 0) return this;
    
            var base = new FakejQuery();
            var elements = selector;
            var i = 0;
            var elms;
            var el;
    
            if (_type(selector) == 'string') {
                elements = [];
                if (selector.charAt(0) === '<') {
                    el = document.createElement('div');
                    el.innerHTML = selector;
                    elms = el.children;
                } else elms = document.querySelectorAll(selector);
                
                for (; i < elms.length; i++)
                    elements.push(elms[i]);
            }
            if (elements) {
                if (_type(elements) != 'string' && (!isArrayLike(elements) || elements === window || elements === elements.self)) elements = [elements];
    
                for (i = 0; i < elements.length; i++)
                    base[i] = elements[i];
                base.length = elements.length;
            }
            return base;
        };
    
        FakejQuery.prototype = {
            on: function (eventName, handler) {
                eventName = (eventName || '').match(_rnothtmlwhite) || [''];
                var eventNameLength = eventName.length;
                var i = 0;
                var el;
                return this.each(function () {
                    el = this;
                    try {
                        if (el.addEventListener) {
                            for (; i < eventNameLength; i++)
                                el.addEventListener(eventName[i], handler);
                        }
                        else if (el.detachEvent) {
                            for (; i < eventNameLength; i++)
                                el.attachEvent('on' + eventName[i], handler);
                        }
                    } catch (e) { }
                });
            },
    
            off: function (eventName, handler) {
                eventName = (eventName || '').match(_rnothtmlwhite) || [''];
    
                var eventNameLength = eventName.length;
                var i = 0;
                var el;
                return this.each(function () {
                    el = this;
                    try {
                        if (el.removeEventListener) {
                            for (; i < eventNameLength; i++)
                                el.removeEventListener(eventName[i], handler);
                        }
                        else if (el.detachEvent) {
                            for (; i < eventNameLength; i++)
                                el.detachEvent('on' + eventName[i], handler);
                        }
                    } catch (e) { }
                });
            },
    
            one: function (eventName, handler) {
                eventName = (eventName || '').match(_rnothtmlwhite) || [''];
                return this.each(function () {
                    var el = FakejQuery(this);
                    FakejQuery.each(eventName, function (i, oneEventName) {
                        var oneHandler = function (e) {
                            handler.call(this, e);
                            el.off(oneEventName, oneHandler);
                        };
                        el.on(oneEventName, oneHandler);
                    });
                });
            },
    
            trigger: function (eventName) {
                var el;
                var event;
                return this.each(function () {
                    el = this;
                    if (document.createEvent) {
                        event = document.createEvent('HTMLEvents');
                        event.initEvent(eventName, true, false);
                        el.dispatchEvent(event);
                    } else el.fireEvent('on' + eventName);
                });
            },
    
            append: function (child) {
                return this.each(function () { insertAdjacentElement(this, 'beforeend', child); });
            },
    
            prepend: function (child) {
                return this.each(function () { insertAdjacentElement(this, 'afterbegin', child); });
            },
    
            before: function (child) {
                return this.each(function () { insertAdjacentElement(this, 'beforebegin', child); });
            },
    
            after: function (child) {
                return this.each(function () { insertAdjacentElement(this, 'afterend', child); });
            },
    
            remove: function () {
                return this.each(function () {
                    var el = this;
                    var parentNode = el.parentNode;
                    if (parentNode != null)
                        parentNode.removeChild(el);
                });
            },
    
            unwrap: function () {
                var parents = [];
                var i;
                var el;
                var parent;
    
                this.each(function () {
                    parent = this.parentNode;
                    if (inArray(parent, parents) === - 1) parents.push(parent);
                });
    
                for (i = 0; i < parents.length; i++) {
                    el = parents[i];
                    parent = el.parentNode;
                    while (el.firstChild)
                        parent.insertBefore(el.firstChild, el);
                    parent.removeChild(el);
                }
    
                return this;
            },
    
            wrapAll: function (wrapperHTML) {
                var i;
                var nodes = this;
                var wrapper = FakejQuery(wrapperHTML)[0];
                var deepest = wrapper;
                var parent = nodes[0].parentNode;
                var previousSibling = nodes[0].previousSibling;
                while (deepest.childNodes.length > 0)
                    deepest = deepest.childNodes[0];
    
                for (i = 0; nodes.length - i; deepest.firstChild === nodes[0] && i++)
                    deepest.appendChild(nodes[i]);
    
                var nextSibling = previousSibling ? previousSibling.nextSibling : parent.firstChild;
                parent.insertBefore(wrapper, nextSibling);
    
                return this;
            },
    
            wrapInner: function (wrapperHTML) {
                return this.each(function () {
                    var el = FakejQuery(this);
                    var contents = el.contents();
    
                    if (contents.length) contents.wrapAll(wrapperHTML);
                    else el.append(wrapperHTML);
                });
            },
    
            wrap: function (wrapperHTML) {
                return this.each(function () { FakejQuery(this).wrapAll(wrapperHTML); });
            },
    
            css: function (styles, val) {
                var el;
                var key;
                var cptStyle;
                var getCptStyle = window.getComputedStyle;
                if (_type(styles) == 'string') {
                    if (val === undefined) {
                        el = this[0];
                        cptStyle = getCptStyle ? getCptStyle(el, null) : el.currentStyle[styles];
                        return getCptStyle ? cptStyle != null ? cptStyle.getPropertyValue(styles) : el.style[styles] : cptStyle;
                    } else {
                        return this.each(function () { setCSSVal(this, styles, val); });
                    }
                } else {
                    return this.each(function () {
                        for (key in styles)
                            setCSSVal(this, key, styles[key]);
                    });
                }
            },
    
            hasClass: function (className) {
                var elem, i = 0;
                var classNamePrepared = ' ' + className + ' ';
                var classList;
    
                while ((elem = this[i++])) {
                    classList = elem.classList;
                    if (classList && classList.contains(className)) return true;
                    else if (elem.nodeType === 1 && (' ' + stripAndCollapse(elem.className + '') + ' ').indexOf(classNamePrepared) > -1) return true;
                }
                return false;
            },
    
            addClass: function (className) {
                var classes;
                var elem;
                var cur;
                var curValue;
                var clazz;
                var finalValue;
                var supportClassList;
                var elmClassList;
                var i = 0;
                var v = 0;
    
                if (className) {
                    classes = className.match(_rnothtmlwhite) || [];
    
                    while ((elem = this[i++])) {
                        elmClassList = elem.classList;
                        if (supportClassList === undefined) supportClassList = elmClassList !== undefined;
    
                        if (supportClassList) {
                            while ((clazz = classes[v++]))
                                elmClassList.add(clazz);
                        } else {
                            curValue = elem.className + '';
                            cur = elem.nodeType === 1 && (' ' + stripAndCollapse(curValue) + ' ');
    
                            if (cur) {
                                while ((clazz = classes[v++]))
                                    if (cur.indexOf(' ' + clazz + ' ') < 0) cur += clazz + ' ';
    
                                finalValue = stripAndCollapse(cur);
                                if (curValue !== finalValue) elem.className = finalValue;
                            }
                        }
                    }
                }
                return this;
            },
    
            removeClass: function (className) {
                var classes;
                var elem;
                var cur;
                var curValue;
                var clazz;
                var finalValue;
                var supportClassList;
                var elmClassList;
                var i = 0;
                var v = 0;
    
                if (className) {
                    classes = className.match(_rnothtmlwhite) || [];
    
                    while ((elem = this[i++])) {
                        elmClassList = elem.classList;
                        if (supportClassList === undefined) supportClassList = elmClassList !== undefined;
    
                        if (supportClassList) {
                            while ((clazz = classes[v++]))
                                elmClassList.remove(clazz);
                        } else {
                            curValue = elem.className + '';
                            cur = elem.nodeType === 1 && (' ' + stripAndCollapse(curValue) + ' ');
    
                            if (cur) {
                                while ((clazz = classes[v++]))
                                    while (cur.indexOf(' ' + clazz + ' ') > -1)
                                        cur = cur.replace(' ' + clazz + ' ', ' ');
    
                                finalValue = stripAndCollapse(cur);
                                if (curValue !== finalValue) elem.className = finalValue;
                            }
                        }
                    }
                }
    
                return this;
            },
    
            hide: function () {
                return this.each(function () { this.style.display = 'none'; });
            },
    
            show: function () {
                return this.each(function () { this.style.display = 'block'; });
            },
    
            attr: function (attrName, value) {
                var i = 0;
                var el;
                while (el = this[i++]) {
                    if (value === undefined) return el.getAttribute(attrName);
                    el.setAttribute(attrName, value);
                }
                return this;
            },
    
            removeAttr: function (attrName) {
                return this.each(function () { this.removeAttribute(attrName); });
            },
    
            offset: function () {
                var el = this[0];
                var rect = el.getBoundingClientRect();
                var scrollLeft = window.pageXOffset || document.documentElement['scrollLeft'];
                var scrollTop = window.pageYOffset || document.documentElement['scrollTop'];
                return {
                    top: rect.top + scrollTop,
                    left: rect.left + scrollLeft
                };
            },
    
            position: function () {
                var el = this[0];
                return {
                    top: el.offsetTop,
                    left: el.offsetLeft
                };
            },
    
            scrollLeft: function (value) {
                var i = 0;
                var el;
                while (el = this[i++]) {
                    if (value === undefined) return el['scrollLeft'];
                    el['scrollLeft'] = value;
                }
                return this;
            },
    
            scrollTop: function (value) {
                var i = 0;
                var el;
                while (el = this[i++]) {
                    if (value === undefined) return el['scrollTop'];
                    el['scrollTop'] = value;
                }
                return this;
            },
    
            val: function (value) {
                var el = this[0];
                if (!value) return el.value;
                el.value = value;
                return this;
            },
    
            first: function () {
                return this.eq(0);
            },
    
            last: function () {
                return this.eq(-1);
            },
    
            eq: function (index) {
                return FakejQuery(this[index >= 0 ? index : this.length + index]);
            },
    
            find: function (selector) {
                var children = [];
                var i;
                this.each(function () {
                    var el = this;
                    var ch = el.querySelectorAll(selector);
                    for (i = 0; i < ch.length; i++)
                        children.push(ch[i]);
                });
                return FakejQuery(children);
            },
    
            children: function (selector) {
                var children = [];
                var el;
                var ch;
                var i;
    
                this.each(function () {
                    ch = this.children;
                    for (i = 0; i < ch.length; i++) {
                        el = ch[i];
                        if (selector) {
                            if ((el.matches && el.matches(selector)) || matches(el, selector)) children.push(el);
                        } else children.push(el);
                    }
                });
                return FakejQuery(children);
            },
    
            parent: function (selector) {
                var parents = [];
                var parent;
                this.each(function () {
                    parent = this.parentNode;
                    if (selector ? FakejQuery(parent).is(selector) : true) parents.push(parent);
                });
                return FakejQuery(parents);
            },
    
            is: function (selector) {
    
                var el;
                var i;
                for (i = 0; i < this.length; i++) {
                    el = this[i];
                    if (selector === ':visible') return elementIsVisible(el);
                    if (selector === ':hidden') return !elementIsVisible(el);
                    if ((el.matches && el.matches(selector)) || matches(el, selector)) return true;
                }
                return false;
            },
    
            contents: function () {
                var contents = [];
                var childs;
                var i;
    
                this.each(function () {
                    childs = this.childNodes;
                    for (i = 0; i < childs.length; i++) contents.push(childs[i]);
                });
                return FakejQuery(contents);
            },
    
            each: function (callback) {
                return each(this, callback);
            },
        };
    
        extend(FakejQuery, {
            extend: extend,
            inArray: inArray,
            isSubstr: isSubstr,
            isEmptyObject: isEmptyObject,
            isPlainObject: isPlainObject,
            each: each
        });
    
        return FakejQuery;
    })();

    var _baseDefaultOptions = (function () {
        var type = COMPAT.type;
        var possibleTypes = ['boolean', 'number', 'string', 'array', 'object', 'function', 'null'];
        var ut = [['img'], ['string', 'array', 'null']];
        var vv = 'v-h:visible-hidden v-s:visible-scroll s:scroll h:hidden';
        var hv = 'v:visible h:hidden a:auto';
        var sv = 'n:never s:scroll l:leave m:move';
        var optionsDefaults = {
            className: ['co_theme-light', ['null', 'string']],
            autoUpdateInterval: [33, 'number'],
            updateOnLoad: ut,
            overflowBehavior: {
                x: ['scroll', vv],
                y: ['scroll', vv]
            },
            scrollPos: {
                x: ['bottom', 'bottom top'],
                y: ['right', 'right left']
            },
            scrollbars: {
                visibility: ['visible', hv],
                autoHide: ['never', sv],
                autoHideDelay: [800, 'number'],
                dragScrolling: [true, 'boolean'],
                clickScrolling: [true, 'boolean']
            },
        };
        var convert = function (template) {
            var recursive = function (obj) {
                var key;
                var val;
                var valType;
                for (key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;
                    val = obj[key];
                    valType = type(val);
                    if (valType == 'array') obj[key] = val[template ? 1 : 0];
                    else if (valType == 'object') obj[key] = recursive(val);
                }
                return obj;
            };
            return recursive(Utils.extend(true, {}, optionsDefaults));
        };

        return {
            _defaults: convert(),
            _template: convert(true),
            _validate: function (obj, template, diffObj) {
                var validatedOptions = {};
                var validatedOptionsPrepared = {};
                var objectCopy = Utils.extend(true, {}, obj);
                var inArray = Utils.inArray;
                var isEmptyObj = Utils.isEmptyObject;
                var checkObjectProps = function (data, template, diffData, validatedOptions, validatedOptionsPrepared, prevPropName) {
                    for (var prop in template) {
                        if (template.hasOwnProperty(prop) && data.hasOwnProperty(prop)) {
                            var isValid = false;
                            var isDiff = false;
                            var templateValue = template[prop];
                            var templateValueType = type(templateValue);
                            var templateIsComplex = templateValueType == 'object';
                            var templateTypes = !COMPAT.isA(templateValue) ? [templateValue] : templateValue;
                            var dataDiffValue = diffData[prop];
                            var dataValue = data[prop];
                            var dataValueType = type(dataValue);
                            var propPrefix = prevPropName ? prevPropName + '.' : '';
                            var restrictSVS;
                            var restrictSVPS;
                            var isRestrictedValue;
                            var mainPossibility;
                            var currType;
                            var i;
                            var v;
                            var j;

                            dataDiffValue = dataDiffValue === undefined ? {} : dataDiffValue;
                            if (templateIsComplex && dataValueType == 'object') {
                                validatedOptions[prop] = {};
                                validatedOptionsPrepared[prop] = {};
                                checkObjectProps(dataValue, templateValue, dataDiffValue, validatedOptions[prop], validatedOptionsPrepared[prop], propPrefix + prop);
                                Utils.each([data, validatedOptions, validatedOptionsPrepared], function (index, value) {
                                    if (isEmptyObj(value[prop])) {
                                        delete value[prop];
                                    }
                                });
                            }
                            else if (!templateIsComplex) {
                                for (i = 0; i < templateTypes.length; i++) {
                                    currType = templateTypes[i];
                                    templateValueType = type(currType);
                                    isRestrictedValue = templateValueType == 'string' && inArray(currType, possibleTypes) === -1;
                                    if (isRestrictedValue) {
                                        restrictSVS = currType.split(' ');
                                        for (v = 0; v < restrictSVS.length; v++) {
                                            restrictSVPS = restrictSVS[v].split(':');
                                            mainPossibility = restrictSVPS[0];
                                            for (j = 0; j < restrictSVPS.length; j++) {
                                                if (dataValue === restrictSVPS[j]) {
                                                    isValid = true;
                                                    break;
                                                }
                                            }
                                            if (isValid) break;
                                        }
                                    }
                                    else {
                                        if (dataValueType === currType) {
                                            isValid = true;
                                            break;
                                        }
                                    }
                                }

                                if (isValid) {
                                    isDiff = dataValue !== dataDiffValue;
                                    if (isDiff) validatedOptions[prop] = dataValue;
                                    if (isRestrictedValue ? inArray(dataDiffValue, restrictSVPS) < 0 : isDiff) validatedOptionsPrepared[prop] = isRestrictedValue ? mainPossibility : dataValue;
                                }
                                
                                delete data[prop];
                            }
                        }
                    }
                };
                checkObjectProps(objectCopy, template, diffObj || {}, validatedOptions, validatedOptionsPrepared);
                
                return {
                    _default: validatedOptions,
                    _prepared: validatedOptionsPrepared
                };
            }
        }
    }());
    
    function scrollGlobals() {
        var _base = this;

        var msie = (function () {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf('MSIE ');
            var trident = ua.indexOf('Trident/');
            var edge = ua.indexOf('Edge/');
            var rv = ua.indexOf('rv:');
            var result;

            if (msie > 0) result = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            else if (trident > 0) result = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            else if (edge > 0) result = parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);

            return result;
        })();

        Utils.extend(_base, {
            msie: msie,
            autoUpdateLoop: false,
            autoUpdateRecommended: false,
            overlayScrollbarDummySize: { x: 30, y: 30 },
            supportPassiveEvents: (function () {
                var supportsPassive = false;
                try {
                    window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
                        get: function () {
                            supportsPassive = true;
                        }
                    }));
                } catch (e) { }
                return supportsPassive;
            })(),
        });
    }

    function scrollInstance(el) {
        var _base = {
            element: el,
            options: {}
        };
        var type = COMPAT.type;
        var each = Utils.each;
        var _frameworkProto = Utils.prototype;

        if (!isHTMLElement(el)) return;

        var _msieVersion;
        var _supportPassiveEvents;

        var _initialized;
        var _isBody;
        var _documentMixed;
        var _domExists;

        var _isBorderBox;
        var _sleeping;
        var _contentBorderSize = {};
        var _scrollHorizontalInfo = {};
        var _scrollVerticalInfo = {};
        var _viewportSize = {};

        var _strMinusHidden = '-hidden';
        var _strMarginMinus = 'margin-';
        var _sPadMins = 'padding-';
        var _sBordMins = 'border-';
        var _strMinMinus = 'min-';
        var _strMaxMinus = 'max-';
        var _strSync = 'sync';
        var _strScroll = 'scroll';
        var _strHundredPercent = '100%';
        var _strScrollbar = 'scrollbar';
        var _strMinusHorizontal = '-horizontal';
        var _strMinusVertical = '-vertical';
        var _strMouseTouchDownEvent = 'mousedown touchstart';
        var _strMouseTouchUpEvent = 'mouseup touchend touchcancel';
        var _strMouseTouchMoveEvent = 'mousemove touchmove';
        var _strMouseEnter = 'mouseenter';
        var _strMouseLeave = 'mouseleave';
        var _strKeyDownEvent = 'keydown';
        var _strKeyUpEvent = 'keyup';
        var _strSelectStartEvent = 'selectstart';

        var _cassNamesPrefix = 'co_';
        var _classNameHTMLElement = _cassNamesPrefix + 'html';
        var _classNameHostElement = _cassNamesPrefix + 'host';
        var _classNameHostElementForeign = _classNameHostElement + '-foreign';
        var _cHH = _classNameHostElement + '-' + _strScrollbar + _strMinusHorizontal + _strMinusHidden;
        var _cVH = _classNameHostElement + '-' + _strScrollbar + _strMinusVertical + _strMinusHidden;
        var _classNameHostTransition = _classNameHostElement + '-transition';
        var _classNameHostScrolling = _classNameHostElement + '-scrolling';
        var _classNameViewportElement = _cassNamesPrefix + 'viewport';
        var _classNameContentElement = _cassNamesPrefix + 'content';
        var _classNameScrollbar = _cassNamesPrefix + _strScrollbar;
        var _classNameScrollbarTrack = _classNameScrollbar + '-track';
        var _classNameScrollbarTrackOff = _classNameScrollbarTrack + '-off';
        var _classNameScrollbarHandle = _classNameScrollbar + '-handle';
        var _classNameScrollbarHandleOff = _classNameScrollbarHandle + '-off';
        var _classNameScrollbarUnusable = _classNameScrollbar + '-unusable';
        var _classNameScrollbarAutoHidden = _classNameScrollbar + '-' + 'auto' + _strMinusHidden;
        var _classNameScrollbarHorizontal = _classNameScrollbar + _strMinusHorizontal;
        var _classNameScrollbarVertical = _classNameScrollbar + _strMinusVertical;
        var _classNameDragging = _cassNamesPrefix + 'dragging';
        var _classNameThemeNone = _cassNamesPrefix + 'theme-none';
        var _classNamesDynamicDestroy = [
            _classNameScrollbarTrackOff,
            _classNameScrollbarHandleOff,
            _classNameScrollbarUnusable,
            _classNameScrollbarAutoHidden,
            _classNameDragging].join(' ');

        var _currentOptions;
        var _currentPreparedOptions;

        var _lastUpdateTime;
        var _swallowedUpdateHints = {};
        var _swallowedUpdateTimeout;
        var _swallowUpdateLag = 42;
        var _updateOnLoadEventName = 'load';
        var _updateOnLoadElms = [];

        var _wE;
        var _docE;
        var _htmlElement;
        var _bodyElement;
        var _tE;
        var _hostElement;
        var _viewportElement;
        var _contentElement;
        var _contentArrangeElement;
        var _sHE;
        var _sHTE;
        var _sHHE;
        var _sVE;
        var _sVTE;
        var _sVHE;
        var _wENative;
        var _docENative;
        var _hostElementNative;
        var _viewportElementNative;
        var _contentElementNative;

        var _hostSizeCache;
        var _contentScrollSizeCache;
        var _hasOverflowCache;
        var _hideOverflowCache;
        var _cssBoxSizingCache;
        var _cssPaddingCache;
        var _cssBorderCache;
        var _cssMarginCache;
        var _cssDirectionCache;
        var _overflowBehaviorCache;
        var _overflowAmountCache;
        var _esDCache;
        var _sVCache;
        var _scrollbarsAutoHideCache;
        var _scrollbarsClickScrollingCache;
        var _scrollbarsDragScrollingCache;
        var _classNameCache;
        var _oldClassName;
        var _bodyMinSizeCache;

        var _destroyEvents = [];
        var _scrollbarsAutoHideTimeoutId;
        var _scrollbarsAutoHideMoveTimeoutId;
        var _scrollbarsAutoHideDelay;
        var _scrollbarsAutoHideNever;
        var _scrollbarsAutoHideScroll;
        var _scrollbarsAutoHideMove;
        var _scrollbarsAutoHideLeave;
        var _scrollbarsHandleHovered;
        var _scrollbarsHandlesDefineScrollPos;

        function initOptions() {
            var options = {};
            var scrollTypes = el.dataset.overlayScroll_type;
            if(typeof scrollTypes !== 'undefined'){
                scrollTypes = scrollTypes.toLowerCase();
                options.overflowBehavior = {
                    x: Utils.isSubstr(scrollTypes, 'scrollx') ? "scroll" : "hidden",
                    y: Utils.isSubstr(scrollTypes, 'scrolly') ? "scroll" : "hidden",
                }
            }

            var scrollPos = el.dataset.overlayScroll_pos;
            if(typeof scrollPos !== 'undefined'){
                scrollPos = scrollPos.toLowerCase();
                options.scrollPos = { 
                    x: Utils.isSubstr(scrollPos, 'top') ? 'top' : 'bottom',
                    y: Utils.isSubstr(scrollPos, 'left') ? 'left' : 'right'
                }
            }

            var scrollVisible = el.dataset.overlayScroll_visible;
            if(typeof scrollVisible !== 'undefined'){
                scrollVisible = scrollVisible.toLowerCase();
                options.scrollbars = {
                    visibility: scrollVisible == 'hide' ? 'hidden' : 'visible',
                    autoHide: scrollVisible == 'auto' ? 'leave' : 'never',
                    autoHideDelay : 100,
                };
            }

            var validatedOpts = _baseDefaultOptions._validate(extendDeep({}, _baseDefaultOptions._defaults, options), _baseDefaultOptions._template, _currentOptions);
            _currentOptions = extendDeep({}, _currentOptions, validatedOpts._default);
            _currentPreparedOptions = extendDeep({}, _currentPreparedOptions, validatedOpts._prepared);
        }

        //==== Event Listener ====//	
        function setupResponsiveEventListener(element, eventNames, listener, remove, passiveOrOptions) {
            var collected = COMPAT.isA(eventNames) && COMPAT.isA(listener);
            var method = remove ? 'removeEventListener' : 'addEventListener';
            var onOff = remove ? 'off' : 'on';
            var events = collected ? false : eventNames.split(' ')
            var i = 0;

            var passiveOrOptionsIsObj = Utils.isPlainObject(passiveOrOptions);
            var passive = _supportPassiveEvents && (passiveOrOptionsIsObj ? (passiveOrOptions._passive || false) : passiveOrOptions);
            var capture = passiveOrOptionsIsObj && (passiveOrOptions._capture || false);
            var useNative = capture || passive;
            var nativeParam = passive ? {
                passive: passive,
                capture: capture,
            } : capture;

            if (collected) {
                for (; i < eventNames.length; i++)
                    setupResponsiveEventListener(element, eventNames[i], listener[i], remove, passiveOrOptions);
            }
            else {
                for (; i < events.length; i++) {
                    if(useNative) {
                        element[0][method](events[i], listener, nativeParam);
                    }
                    else {
                        element[onOff](events[i], listener);
                    }     
                }
            }
        }
        function addDestroyEventListener(element, eventNames, listener, passive) {
            setupResponsiveEventListener(element, eventNames, listener, false, passive);
            _destroyEvents.push(COMPAT.bind(setupResponsiveEventListener, 0, element, eventNames, listener, true, passive));
        }
        function hostOnMouseEnter() {
            if (_scrollbarsAutoHideLeave)
                refreshScrollbarsAutoHide(true);
        }
        function hostOnMouseLeave() {
            if (_scrollbarsAutoHideLeave && !_bodyElement.hasClass(_classNameDragging)) refreshScrollbarsAutoHide(false);
        }
        function hostOnMouseMove() {
            if (_scrollbarsAutoHideMove) {
                refreshScrollbarsAutoHide(true);
                clearTimeout(_scrollbarsAutoHideMoveTimeoutId);
                _scrollbarsAutoHideMoveTimeoutId = setTimeout(function () {
                    if (_scrollbarsAutoHideMove) refreshScrollbarsAutoHide(false);
                }, 100);
            }
        }
        function documentOnSelectStart(event) {
            COMPAT.prvD(event);
            return false;
        }
        function updateOnLoadCallback(event) {
            var elm = Utils(event.target);
            eachUpdateOnLoad(function (i, updateOnLoadSelector) {
                if (elm.is(updateOnLoadSelector)) update({ _contentSizeChanged: true });
            });
        }
        function setupHostMouseTouchEvents(destroy) {
            if (!destroy) setupHostMouseTouchEvents(true);

            setupResponsiveEventListener(_hostElement,
                _strMouseTouchMoveEvent.split(' ')[0],
                hostOnMouseMove,
                (!_scrollbarsAutoHideMove || destroy), true);
            setupResponsiveEventListener(_hostElement,
                [_strMouseEnter, _strMouseLeave],
                [hostOnMouseEnter, hostOnMouseLeave],
                (!_scrollbarsAutoHideLeave || destroy), true);

            if (!_initialized && !destroy) _hostElement.one('mouseover', hostOnMouseEnter);
        }

        //==== Update Detection ====//
        function bodyMinSizeChanged() {
            var bodyMinSize = {};
            if (_isBody && _contentArrangeElement) {
                bodyMinSize.w = parseToZeroOrNumber(_contentArrangeElement.css(_strMinMinus + 'width'));
                bodyMinSize.h = parseToZeroOrNumber(_contentArrangeElement.css(_strMinMinus + 'height'));
                bodyMinSize.c = checkCache(bodyMinSize, _bodyMinSizeCache);
                bodyMinSize.f = true; //flag for "measured at least once"
            }
            _bodyMinSizeCache = bodyMinSize;
            return !!bodyMinSize.c;
        }
        function updateAutoContentSizeChanged() {
            if (_sleeping) return false;

            var contentMeasureElement = getContentMeasureElement();
            var setCSS = false;
            var css = {};
            var float;
            var bodyMinSizeC;
            var changed;
            var contentElementScrollSize;

            if (setCSS) {
                float = _contentElement.css('float');
                css['float'] = 'left';
                css['width'] = 'auto';
                _contentElement.css(css);
            }
            contentElementScrollSize = {
                w: contentMeasureElement.scrollWidth,
                h: contentMeasureElement.scrollHeight
            };
            if (setCSS) {
                css['float'] = float;
                css['width'] = _strHundredPercent;
                _contentElement.css(css);
            }

            bodyMinSizeC = bodyMinSizeChanged();
            changed = checkCache(contentElementScrollSize, _esDCache);

            _esDCache = contentElementScrollSize;

            return changed || bodyMinSizeC;
        }

        //==== Update ====//
        function update(updateHints) {
            clearTimeout(_swallowedUpdateTimeout);
            updateHints = updateHints || {};
            _swallowedUpdateHints._hostSizeChanged |= updateHints._hostSizeChanged;
            _swallowedUpdateHints._contentSizeChanged |= updateHints._contentSizeChanged;
            _swallowedUpdateHints._force |= updateHints._force;

            var now = Date.now && Date.now() || new Date().getTime();
            var hostSizeChanged = !!_swallowedUpdateHints._hostSizeChanged;
            var contentSizeChanged = !!_swallowedUpdateHints._contentSizeChanged;
            var force = !!_swallowedUpdateHints._force;
            var changedOptions = updateHints._changedOptions;
            var swallow = _swallowUpdateLag > 0 && _initialized && !force && !changedOptions && (now - _lastUpdateTime) < _swallowUpdateLag ;
            var displayIsHidden;

            if (swallow) _swallowedUpdateTimeout = setTimeout(update, _swallowUpdateLag);
            if (swallow || (_sleeping && !changedOptions) || (_initialized && !force && (displayIsHidden = _hostElement.is(':hidden'))) || _hostElement.css('display') === 'inline') return;

            _lastUpdateTime = now;
            _swallowedUpdateHints = {};

            changedOptions = changedOptions || {};
            var checkCacheAutoForce = function () {
                return checkCache.apply(this, [].slice.call(arguments).concat([force]));
            };

            var currScroll = {
                x: _viewportElement['scrollLeft'](),
                y: _viewportElement['scrollTop']()
            };

            var currentPreparedOptionsScrollbars = _currentPreparedOptions.scrollbars;

            var scrollbarsVisibility = currentPreparedOptionsScrollbars.visibility;
            var scrollbarsVisibilityChanged = checkCacheAutoForce(scrollbarsVisibility, _sVCache);

            var scrollbarsAutoHide = currentPreparedOptionsScrollbars.autoHide;
            var scrollbarsAutoHideChanged = checkCacheAutoForce(scrollbarsAutoHide, _scrollbarsAutoHideCache);

            var scrollbarsClickScrolling = currentPreparedOptionsScrollbars.clickScrolling;
            var scrollbarsClickScrollingChanged = checkCacheAutoForce(scrollbarsClickScrolling, _scrollbarsClickScrollingCache);

            var scrollbarsDragScrolling = currentPreparedOptionsScrollbars.dragScrolling;
            var scrollbarsDragScrollingChanged = checkCacheAutoForce(scrollbarsDragScrolling, _scrollbarsDragScrollingCache);

            var className = _currentPreparedOptions.className;
            var classNameChanged = checkCacheAutoForce(className, _classNameCache);

            var overflowBehavior = _currentPreparedOptions.overflowBehavior;
            var overflowBehaviorChanged = checkCacheAutoForce(overflowBehavior, _overflowBehaviorCache, force);

            _scrollbarsAutoHideNever = scrollbarsAutoHide === 'n';
            _scrollbarsAutoHideScroll = scrollbarsAutoHide === 's';
            _scrollbarsAutoHideMove = scrollbarsAutoHide === 'm';
            _scrollbarsAutoHideLeave = scrollbarsAutoHide === 'l';

            _scrollbarsAutoHideDelay = currentPreparedOptionsScrollbars.autoHideDelay;

            _oldClassName = _classNameCache;

            _sVCache = scrollbarsVisibility;
            _scrollbarsAutoHideCache = scrollbarsAutoHide;
            _scrollbarsClickScrollingCache = scrollbarsClickScrolling;
            _scrollbarsDragScrollingCache = scrollbarsDragScrolling;
            _classNameCache = className;
            _overflowBehaviorCache = extendDeep({}, overflowBehavior);
            _hasOverflowCache = _hasOverflowCache || { x: false, y: false };

            if (classNameChanged) {
                removeClass(_hostElement, _oldClassName + ' ' + _classNameThemeNone);
                addClass(_hostElement, className !== undefined && className !== null && className.length > 0 ? className : _classNameThemeNone);
            }

            displayIsHidden = displayIsHidden === undefined ? _hostElement.is(':hidden') : displayIsHidden;
            var cssDirection = _hostElement.css('direction');
            var cssDirectionChanged = checkCacheAutoForce(cssDirection, _cssDirectionCache);
            var boxSizing = _hostElement.css('box-sizing');
            var boxSizingChanged = checkCacheAutoForce(boxSizing, _cssBoxSizingCache);
            var padding = getTopRightBottomLeftHost(_sPadMins);

            _isBorderBox = (boxSizing === 'border-box');

            var updateBorderX = !_isBorderBox;
            var updateBorderY = !_isBorderBox;
            var border = getTopRightBottomLeftHost(_sBordMins, '-' + 'width', !updateBorderX, !updateBorderY)

            var margin = getTopRightBottomLeftHost(_strMarginMinus);
            var contentElementCSS = {};

            var getHostSize = function () {
                return {
                    w: _hostElementNative.clientWidth,
                    h: _hostElementNative.clientHeight
                };
            };
            var getViewportSize = function () {
                return {
                    w: _viewportElementNative.offsetWidth + Math.max(0, _contentElementNative.clientWidth - _contentElementNative.scrollWidth),
                    h: _viewportElementNative.offsetHeight + Math.max(0, _contentElementNative.clientHeight - _contentElementNative.scrollHeight)
                };
            };

            padding.c = checkCacheAutoForce(padding, _cssPaddingCache);

            _borderX = border.l + border.r;
            _borderY = border.t + border.b;
            border.c = checkCacheAutoForce(border, _cssBorderCache);

            _marginX = margin.l + margin.r;
            _marginY = margin.t + margin.b;
            margin.c = checkCacheAutoForce(margin, _cssMarginCache);

            _cssDirectionCache = cssDirection;
            _cssBoxSizingCache = boxSizing;
            _cssPaddingCache = padding;
            _cssBorderCache = border;
            _cssMarginCache = margin;

            if (padding.c || cssDirectionChanged || boxSizingChanged ) {
                var paddingValues = [padding.t, padding.r, padding.b, padding.l];
                setTopRightBottomLeft(contentElementCSS, _sPadMins, paddingValues);
            }

            _viewportSize = getViewportSize();
            _contentElement.css(contentElementCSS);
            contentElementCSS = {};

            if (hostSizeChanged || contentSizeChanged || cssDirectionChanged || boxSizingChanged || overflowBehaviorChanged || scrollbarsVisibilityChanged || scrollbarsAutoHideChanged || scrollbarsDragScrollingChanged || scrollbarsClickScrollingChanged) {
                var strOverflow = 'overflow';
                var strOverflowX = strOverflow + '-x';
                var strOverflowY = strOverflow + '-y';

                var viewportElementResetCSS = {};
                setTopRightBottomLeft(viewportElementResetCSS, '');
                var contentMeasureElement = getContentMeasureElement();

                _viewportElement.css(viewportElementResetCSS);
                _viewportSize = getViewportSize();
                var hostSize = getHostSize();
                
                _contentElement.css(contentElementCSS);
                contentElementCSS = {};

                var contentScrollSize = {
                    w: contentMeasureElement.scrollWidth,
                    h: contentMeasureElement.scrollHeight,
                };
                contentScrollSize.c = contentSizeChanged = checkCacheAutoForce(contentScrollSize, _contentScrollSizeCache);
                _contentScrollSizeCache = contentScrollSize;

                _viewportSize = getViewportSize();

                hostSize = getHostSize();
                hostSizeChanged = checkCacheAutoForce(hostSize, _hostSizeCache);
                _hostSizeCache = hostSize;

                var previousOverflowAmount = _overflowAmountCache;
                var overflowBehaviorIsVS = {};
                var overflowBehaviorIsVH = {};
                var overflowBehaviorIsS = {};
                var overflowAmount = {};
                var hasOverflow = {};
                var hideOverflow = {};
                var canScroll = {};
                var viewportRect = _viewportElementNative.getBoundingClientRect();
                var setOverflowVariables = function (horizontal) {
                    var scrollbarVars = getScrollbarVars(horizontal);
                    var scrollbarVarsInverted = getScrollbarVars(!horizontal);
                    var xyI = scrollbarVarsInverted._x_y;
                    var xy = scrollbarVars._x_y;
                    var wh = scrollbarVars._w_h;
                    var widthHeight = scrollbarVars._width_height;
                    var scrollMax = _strScroll + scrollbarVars._Left_Top + 'Max';
                    var fractionalOverflowAmount = viewportRect[widthHeight] ? Math.abs(viewportRect[widthHeight] - _viewportSize[wh]) : 0;
                    var checkFractionalOverflowAmount = previousOverflowAmount && previousOverflowAmount[xy] > 0 && _viewportElementNative[scrollMax] === 0;
                    overflowBehaviorIsVS[xy] = overflowBehavior[xy] === 'v-s';
                    overflowBehaviorIsVH[xy] = overflowBehavior[xy] === 'v-h';
                    overflowBehaviorIsS[xy] = overflowBehavior[xy] === 's';
                    overflowAmount[xy] = Math.max(0, Math.round((contentScrollSize[wh] - _viewportSize[wh]) * 100) / 100);
                    overflowAmount[xy] *= (checkFractionalOverflowAmount && fractionalOverflowAmount > 0 && fractionalOverflowAmount < 1) ? 0 : 1;
                    hasOverflow[xy] = overflowAmount[xy] > 0;
                    hideOverflow[xy] = overflowBehaviorIsVS[xy] || overflowBehaviorIsVH[xy] ? (hasOverflow[xyI] && !overflowBehaviorIsVS[xyI] && !overflowBehaviorIsVH[xyI]) : hasOverflow[xy];
                    hideOverflow[xy + 's'] = hideOverflow[xy] ? (overflowBehaviorIsS[xy] || overflowBehaviorIsVS[xy]) : false;

                    canScroll[xy] = hasOverflow[xy] && hideOverflow[xy + 's'];
                };
                setOverflowVariables(true);
                setOverflowVariables(false);

                overflowAmount.c = checkCacheAutoForce(overflowAmount, _overflowAmountCache);
                _overflowAmountCache = overflowAmount;
                hasOverflow.c = checkCacheAutoForce(hasOverflow, _hasOverflowCache);
                _hasOverflowCache = hasOverflow;
                hideOverflow.c = checkCacheAutoForce(hideOverflow, _hideOverflowCache);
                _hideOverflowCache = hideOverflow;

                var v_EC = {};
                var setViewportCSS;
                if (hostSizeChanged || hasOverflow.c || hideOverflow.c || contentScrollSize.c || overflowBehaviorChanged || boxSizingChanged || cssDirectionChanged ) {
                    v_EC['left'] = '';
                    setViewportCSS = function (horizontal) {
                        var scrollbarVars = getScrollbarVars(horizontal);
                        var scrollbarVarsInverted = getScrollbarVars(!horizontal);
                        var xy = scrollbarVars._x_y;
                        var XY = scrollbarVars._X_Y;
                        var strDirection = horizontal ? 'bottom' : 'right';

                        var reset = function () {
                            v_EC[strDirection] = '';
                            _contentBorderSize[scrollbarVarsInverted._w_h] = 0;
                        };
                        if (hasOverflow[xy] && hideOverflow[xy + 's']) {
                            v_EC[strOverflow + XY] = _strScroll;
                            v_EC[strDirection] = '';
                            _contentBorderSize[scrollbarVarsInverted._w_h] = 0;
                        } else {
                            v_EC[strOverflow + XY] = '';
                            reset();
                        }
                    };
                    setViewportCSS(true);
                    setViewportCSS(false);

                    v_EC[_sPadMins + 'top'] = v_EC[_strMarginMinus + 'top'] = v_EC[_sPadMins + 'left'] = v_EC[_strMarginMinus + 'left'] = '';
                    v_EC[_sPadMins + 'right'] = v_EC[_strMarginMinus + 'right'] = '';

                    if ((hasOverflow.x && hideOverflow.x) || (hasOverflow.y && hideOverflow.y)) {
                        
                    }
                    else {
                        if (overflowBehaviorIsVH.x || overflowBehaviorIsVS.x || overflowBehaviorIsVH.y || overflowBehaviorIsVS.y) {
                            v_EC[strOverflowX] = v_EC[strOverflowY] = 'visible';
                        }
                    }

                    _viewportElement.css(v_EC);
                    v_EC = {};

                    if ((hasOverflow.c || boxSizingChanged )) {
                        var elementStyle = _contentElementNative.style;
                        var dump;
                        elementStyle.webkitTransform = 'scale(1)';
                        elementStyle.display = 'run-in';
                        dump = _contentElementNative.offsetHeight;
                        elementStyle.display = ''; //|| dump; //use dump to prevent it from deletion if minify
                        elementStyle.webkitTransform = '';
                    }
                }

                contentElementCSS = {};
                if (cssDirectionChanged ) contentElementCSS['left'] = '';
                _contentElement.css(contentElementCSS);

                _viewportElement['scrollLeft'](currScroll.x)['scrollTop'](currScroll.y);

                var scrollbarsVisibilityVisible = scrollbarsVisibility === 'v';
                var scrollbarsVisibilityHidden = scrollbarsVisibility === 'h';
                var scrollbarsVisibilityAuto = scrollbarsVisibility === 'a';
                var refreshScrollbarsVisibility = function (showX, showY) {
                    showY = showY === undefined ? showX : showY;
                    refreshScrollbarAppearance(true, showX, canScroll.x)
                    refreshScrollbarAppearance(false, showY, canScroll.y)
                };

                if (scrollbarsVisibilityChanged || overflowBehaviorChanged || hideOverflow.c || hasOverflow.c ) {
                    if (scrollbarsVisibilityAuto) {
                        refreshScrollbarsVisibility(canScroll.x, canScroll.y);
                    }
                    else if (scrollbarsVisibilityVisible) {
                        refreshScrollbarsVisibility(true);
                    }
                    else if (scrollbarsVisibilityHidden) {
                        refreshScrollbarsVisibility(false);
                    }
                }

                if (scrollbarsAutoHideChanged ) {
                    setupHostMouseTouchEvents(!_scrollbarsAutoHideLeave && !_scrollbarsAutoHideMove);
                    refreshScrollbarsAutoHide(_scrollbarsAutoHideNever, !_scrollbarsAutoHideNever);
                }

                if (hostSizeChanged || overflowAmount.c || boxSizingChanged || cssDirectionChanged) {
                    refreshScrollbarHandleLength(true);
                    refreshScrollbarHandleOffset(true);
                    refreshScrollbarHandleLength(false);
                    refreshScrollbarHandleOffset(false);
                }

                if (scrollbarsClickScrollingChanged)
                    refreshScrollbarsInteractive(true, scrollbarsClickScrolling);
                if (scrollbarsDragScrollingChanged)
                    refreshScrollbarsInteractive(false, scrollbarsDragScrolling);
            }

            if (_isBody && _bodyMinSizeCache && (_hasOverflowCache.c || _bodyMinSizeCache.c)) {
                if (!_bodyMinSizeCache.f) bodyMinSizeChanged();
                _bodyMinSizeCache.c = false;
            }

            if (_initialized && changedOptions.updateOnLoad) {
                updateElementsOnLoad();
            }
        }
        function updateElementsOnLoad() {
            eachUpdateOnLoad(function (i, updateOnLoadSelector) {
                _contentElement.find(updateOnLoadSelector).each(function (i, el) {
                    if (COMPAT.inA(el, _updateOnLoadElms) < 0) {
                        _updateOnLoadElms.push(el);
                        Utils(el)
                            .off(_updateOnLoadEventName, updateOnLoadCallback)
                            .on(_updateOnLoadEventName, updateOnLoadCallback);
                    }
                });
            });
        }

        //==== Structure ====//
        function setupStructureDOM() {
            _hostElement = _hostElement || _tE;
            _contentElement = _contentElement || selectOrGenerateDivByClass(_classNameContentElement);
            _viewportElement = _viewportElement || selectOrGenerateDivByClass(_classNameViewportElement);

            if (_domExists) addClass(_hostElement, _classNameHostElementForeign);

            if (!_domExists) {
                addClass(_tE, _classNameHostElement);
                _hostElement.wrapInner(_contentElement)
                    .wrapInner(_viewportElement);

                _contentElement = findFirst(_hostElement, '.' + _classNameContentElement);
                _viewportElement = findFirst(_hostElement, '.' + _classNameViewportElement);
            }

            if (_isBody) addClass(_htmlElement, _classNameHTMLElement);

            _hostElementNative = _hostElement[0];
            _viewportElementNative = _viewportElement[0];
            _contentElementNative = _contentElement[0];
        }
        function setupStructureEvents() {
            var scrollStopTimeoutId;
            var scrollStopDelay = 175;
            
            function viewportOnScroll(event) {
                if (!_sleeping) {
                    if (scrollStopTimeoutId !== undefined) clearTimeout(scrollStopTimeoutId);
                    else {
                        if (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove) refreshScrollbarsAutoHide(true);
                        addClass(_hostElement, _classNameHostScrolling);
                    }

                    if (!_scrollbarsHandlesDefineScrollPos) {
                        refreshScrollbarHandleOffset(true);
                        refreshScrollbarHandleOffset(false);
                    }
                    scrollStopTimeoutId = setTimeout(function () {
                        clearTimeout(scrollStopTimeoutId);
                        scrollStopTimeoutId = undefined;
                        if (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove) refreshScrollbarsAutoHide(false);
                        removeClass(_hostElement, _classNameHostScrolling);
                    }, scrollStopDelay);
                }
            }

            addDestroyEventListener(_viewportElement, _strScroll, viewportOnScroll, true);
        }

        //==== Scrollbars ====//
        function setupScrollbarsDOM(destroy) {
            var selectOrGenerateScrollbarDOM = function (isHorizontal) {
                var posClassName = 'position-' + (isHorizontal ? _currentPreparedOptions.scrollPos.x : _currentPreparedOptions.scrollPos.y);
                var scrollbarClassName = isHorizontal ? _classNameScrollbarHorizontal : _classNameScrollbarVertical;
                var scrollbar = selectOrGenerateDivByClass(_classNameScrollbar + ' ' + scrollbarClassName + ' ' + posClassName, true);
                var track = selectOrGenerateDivByClass(_classNameScrollbarTrack, scrollbar);
                var handle = selectOrGenerateDivByClass(_classNameScrollbarHandle, scrollbar);

                if (!_domExists && !destroy) {
                    scrollbar.append(track);
                    track.append(handle);
                }

                return {
                    _scrollbar: scrollbar,
                    _track: track,
                    _handle: handle
                };
            };
            function resetScrollbarDOM(isHorizontal) {
                var scrollbarVars = getScrollbarVars(isHorizontal);
                var scrollbar = scrollbarVars._scrollbar;
                var track = scrollbarVars._track;
                var handle = scrollbarVars._handle;

                if (_domExists && _initialized) {
                    each([scrollbar, track, handle], function (i, elm) {
                        removeClass(elm.removeAttr('style'), _classNamesDynamicDestroy);
                    });
                }
                else {
                    remove(scrollbar || selectOrGenerateScrollbarDOM(isHorizontal)._scrollbar);
                }
            }
            var horizontalElements;
            var verticalElements;

            if (!destroy) {
                horizontalElements = selectOrGenerateScrollbarDOM(true);
                verticalElements = selectOrGenerateScrollbarDOM();

                _sHE = horizontalElements._scrollbar;
                _sHTE = horizontalElements._track;
                _sHHE = horizontalElements._handle;
                _sVE = verticalElements._scrollbar;
                _sVTE = verticalElements._track;
                _sVHE = verticalElements._handle;

                if (!_domExists) {
                    _viewportElement.after(_sVE);
                    _viewportElement.after(_sHE);
                }
            }
            else {
                resetScrollbarDOM(true);
                resetScrollbarDOM();
            }
        }
        function setupScrollbarEvents(isHorizontal) {
            var scrollbarVars = getScrollbarVars(isHorizontal);
            var scrollbarVarsInfo = scrollbarVars._info;
            var insideIFrame = _wENative.top !== _wENative;
            var xy = scrollbarVars._x_y;
            var XY = scrollbarVars._X_Y;
            var scroll = _strScroll + scrollbarVars._Left_Top;
            var trackTimeout;
            var mouseDownScroll;
            var mouseDownOffset;

            function getPointerPosition(event) {
                return _msieVersion && insideIFrame ? event['screen' + XY] : COMPAT.page(event)[xy]; 
            }
            function getPreparedScrollbarsOption(name) {
                return _currentPreparedOptions.scrollbars[name];
            }
            function onMouseTouchDownContinue(event) {
                var originalEvent = event.originalEvent || event;
                var isTouchEvent = originalEvent.touches !== undefined;
                return _sleeping || !_scrollbarsDragScrollingCache || COMPAT.mBtn(event) === 1 || isTouchEvent;
            }
            function documentDragMove(event) {
                if (onMouseTouchDownContinue(event)) {
                    var trackLength = scrollbarVarsInfo._trackLength;
                    var handleLength = scrollbarVarsInfo._handleLength;
                    var scrollRange = scrollbarVarsInfo._maxScroll;
                    var scrollRaw = (getPointerPosition(event) - mouseDownOffset);
                    var scrollDeltaPercent = scrollRaw / (trackLength - handleLength);
                    var scrollDelta = (scrollRange * scrollDeltaPercent);
                    scrollDelta = isFinite(scrollDelta) ? scrollDelta : 0;

                    _viewportElement[scroll](Math.round(mouseDownScroll + scrollDelta));

                    if (_scrollbarsHandlesDefineScrollPos)
                        refreshScrollbarHandleOffset(isHorizontal, mouseDownScroll + scrollDelta);

                    if (!_supportPassiveEvents)
                        COMPAT.prvD(event);
                } else documentMouseTouchUp(event);
            }
            function documentMouseTouchUp(event) {
                event = event || event.originalEvent;

                setupResponsiveEventListener(_docE,
                    [_strMouseTouchMoveEvent, _strMouseTouchUpEvent, _strKeyDownEvent, _strKeyUpEvent, _strSelectStartEvent],
                    [documentDragMove, documentMouseTouchUp, documentOnSelectStart],
                    true);
                COMPAT.rAF()(function() {
                    setupResponsiveEventListener(_docE, 'click', COMPAT.stpP(event), true, { _capture: true });
                });
                
                    
                if (_scrollbarsHandlesDefineScrollPos) refreshScrollbarHandleOffset(isHorizontal, true);

                _scrollbarsHandlesDefineScrollPos = false;
                removeClass(_bodyElement, _classNameDragging);
                removeClass(scrollbarVars._handle, 'active');
                removeClass(scrollbarVars._track, 'active');
                removeClass(scrollbarVars._scrollbar, 'active');

                mouseDownScroll = undefined;
                mouseDownOffset = undefined;

                if (trackTimeout !== undefined) {
                    _base.scrollStop();
                    clearTimeout(trackTimeout);
                    trackTimeout = undefined;
                }

                if (event) {
                    var rect = _hostElementNative.getBoundingClientRect();
                    var mouseInsideHost = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;

                    if (!mouseInsideHost)
                        hostOnMouseLeave();

                    if (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove)
                        refreshScrollbarsAutoHide(false);
                }
            }
            function onHandleMouseTouchDown(event) {
                if (onMouseTouchDownContinue(event))
                    onHandleMouseTouchDownAction(event);
            }
            function onHandleMouseTouchDownAction(event) {
                mouseDownScroll = _viewportElement[scroll]();
                mouseDownScroll = isNaN(mouseDownScroll) || mouseDownScroll < 0 ? 0 : mouseDownScroll;

                mouseDownOffset = getPointerPosition(event);

                _scrollbarsHandlesDefineScrollPos = !getPreparedScrollbarsOption('snapHandle');
                addClass(_bodyElement, _classNameDragging);
                addClass(scrollbarVars._handle, 'active');
                addClass(scrollbarVars._scrollbar, 'active');

                setupResponsiveEventListener(_docE,
                    [_strMouseTouchMoveEvent, _strMouseTouchUpEvent, _strSelectStartEvent],
                    [documentDragMove, documentMouseTouchUp, documentOnSelectStart]);
                COMPAT.rAF()(function() {
                    setupResponsiveEventListener(_docE, 'click', COMPAT.stpP(event), false, { _capture: true });
                });
                

                if (_msieVersion || !_documentMixed)
                    COMPAT.prvD(event);
                COMPAT.stpP(event);
            }
            function onTrackMouseTouchDown(event) {
                if (onMouseTouchDownContinue(event)) {
                    var trackOffset = scrollbarVars._track.offset()[scrollbarVars._left_top];
                    var scrollAction = function () {
                        var mouseOffset = (mouseDownOffset - trackOffset);
                        var trackLength = scrollbarVarsInfo._trackLength;
                        var handleLength = scrollbarVarsInfo._handleLength;
                        var scrollRange = scrollbarVarsInfo._maxScroll;
                        var instantScrollPosition = scrollRange * ((mouseOffset - (handleLength / 2)) / (trackLength - handleLength)); 
                       
                        instantScrollPosition = isFinite(instantScrollPosition) ? instantScrollPosition : 0;
                        _viewportElement[scroll](instantScrollPosition); 
                        refreshScrollbarHandleOffset(isHorizontal, instantScrollPosition);
                    };

                    mouseDownOffset = COMPAT.page(event)[xy];

                    _scrollbarsHandlesDefineScrollPos = !getPreparedScrollbarsOption('snapHandle');
                    addClass(_bodyElement, _classNameDragging);
                    addClass(scrollbarVars._track, 'active');
                    addClass(scrollbarVars._scrollbar, 'active');

                    setupResponsiveEventListener(_docE,
                        [_strMouseTouchUpEvent, _strKeyDownEvent, _strKeyUpEvent, _strSelectStartEvent],
                        [documentMouseTouchUp, documentOnSelectStart]);

                    scrollAction();
                    COMPAT.prvD(event);
                    COMPAT.stpP(event);
                }
            }
            function onTrackMouseTouchEnter(event) {
                _scrollbarsHandleHovered = true;
                if (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove)
                    refreshScrollbarsAutoHide(true);
            }
            function onTrackMouseTouchLeave(event) {
                _scrollbarsHandleHovered = false;
                if (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove)
                    refreshScrollbarsAutoHide(false);
            }
            function onScrollbarMouseTouchDown(event) {
                COMPAT.stpP(event);
            }

            addDestroyEventListener(scrollbarVars._handle, _strMouseTouchDownEvent, onHandleMouseTouchDown);
            addDestroyEventListener(scrollbarVars._track, [_strMouseTouchDownEvent, _strMouseEnter, _strMouseLeave], [onTrackMouseTouchDown, onTrackMouseTouchEnter, onTrackMouseTouchLeave]);
            addDestroyEventListener(scrollbarVars._scrollbar, _strMouseTouchDownEvent, onScrollbarMouseTouchDown);
        }
        function refreshScrollbarAppearance(isHorizontal, shallBeVisible, canScroll) {
            var scrollbarHiddenClassName = isHorizontal ? _cHH : _cVH;
            var scrollbarElement = isHorizontal ? _sHE : _sVE;

            addRemoveClass(_hostElement, scrollbarHiddenClassName, !shallBeVisible);
            addRemoveClass(scrollbarElement, _classNameScrollbarUnusable, !canScroll);
        }
        function refreshScrollbarsAutoHide(shallBeVisible, delayfree) {
            clearTimeout(_scrollbarsAutoHideTimeoutId);
            if (shallBeVisible) {
                removeClass(_sHE, _classNameScrollbarAutoHidden);
                removeClass(_sVE, _classNameScrollbarAutoHidden);
            }
            else {
                var anyActive;
                var hide = function () {
                    if (!_scrollbarsHandleHovered) {
                        anyActive = _sHHE.hasClass('active') || _sVHE.hasClass('active');
                        if (!anyActive && (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove || _scrollbarsAutoHideLeave))
                            addClass(_sHE, _classNameScrollbarAutoHidden);
                        if (!anyActive && (_scrollbarsAutoHideScroll || _scrollbarsAutoHideMove || _scrollbarsAutoHideLeave))
                            addClass(_sVE, _classNameScrollbarAutoHidden);
                    }
                };
                if (_scrollbarsAutoHideDelay > 0 && delayfree !== true)
                    _scrollbarsAutoHideTimeoutId = setTimeout(hide, _scrollbarsAutoHideDelay);
                else
                    hide();
            }
        }
        function refreshScrollbarHandleLength(isHorizontal) {
            var handleCSS = {};
            var scrollbarVars = getScrollbarVars(isHorizontal);
            var scrollbarVarsInfo = scrollbarVars._info;
            var digit = 1000000;
            var handleRatio = Math.min(1, _viewportSize[scrollbarVars._w_h] / _contentScrollSizeCache[scrollbarVars._w_h]);
            handleCSS[scrollbarVars._width_height] = (Math.floor(handleRatio * 100 * digit) / digit) + '%'; //the last * digit / digit is for flooring to the 4th digit

            scrollbarVars._handle.css(handleCSS);
            scrollbarVarsInfo._handleLength = scrollbarVars._handle[0]['offset' + scrollbarVars._Width_Height];
            scrollbarVarsInfo._handleLengthRatio = handleRatio;
        }
        function refreshScrollbarHandleOffset(isHorizontal, scrollOrTransition) {
            var transition = type(scrollOrTransition) == 'boolean';
            var scrollbarVars = getScrollbarVars(isHorizontal);
            var scrollbarVarsInfo = scrollbarVars._info;
            var nativeScroll = isHorizontal ? _viewportElement['scrollLeft']() : _viewportElement['scrollTop']();
            var currentScroll = scrollOrTransition === undefined || transition ? nativeScroll : scrollOrTransition;

            var handleLength = scrollbarVarsInfo._handleLength;
            var trackLength = scrollbarVars._track[0]['offset' + scrollbarVars._Width_Height];
            var handleTrackDiff = trackLength - handleLength;
            var handleCSS = {};

            var maxScroll = (_viewportElementNative[_strScroll + scrollbarVars._Width_Height] - _viewportElementNative['client' + scrollbarVars._Width_Height]);
            var getScrollRatio = function (base) {
                return isNaN(base / maxScroll) ? 0 : Math.max(0, Math.min(1, base / maxScroll));
            };
            var getHandleOffset = function (scrollRatio) {
                var offset = handleTrackDiff * scrollRatio;
                offset = isNaN(offset) ? 0 : offset;
                offset = Math.max(0, offset);
                return offset;
            };
            var scrollRatio = getScrollRatio(nativeScroll);
            var unsnappedScrollRatio = getScrollRatio(currentScroll);
            var handleOffset = getHandleOffset(unsnappedScrollRatio);
            var snappedHandleOffset = getHandleOffset(scrollRatio);

            scrollbarVarsInfo._maxScroll = maxScroll;
            scrollbarVarsInfo._currentScroll = nativeScroll;
            scrollbarVarsInfo._currentScrollRatio = scrollRatio;

            handleCSS[scrollbarVars._left_top] = handleOffset;
            scrollbarVars._handle.css(handleCSS);

            scrollbarVarsInfo._handleOffset = handleOffset;
            scrollbarVarsInfo._snappedHandleOffset = snappedHandleOffset;
            scrollbarVarsInfo._trackLength = trackLength;
        }
        function refreshScrollbarsInteractive(isTrack, value) {
            var action = value ? 'removeClass' : 'addClass';
            var element1 = isTrack ? _sHTE : _sHHE;
            var element2 = isTrack ? _sVTE : _sVHE;
            var className = isTrack ? _classNameScrollbarTrackOff : _classNameScrollbarHandleOff;

            element1[action](className);
            element2[action](className);
        }
        function getScrollbarVars(isHorizontal) {
            return {
                _width_height: isHorizontal ? 'width' : 'height',
                _Width_Height: isHorizontal ? 'Width' : 'Height',
                _left_top: isHorizontal ? 'left' : 'top',
                _Left_Top: isHorizontal ? 'Left' : 'Top',
                _x_y: isHorizontal ? 'x' : 'y',
                _X_Y: isHorizontal ? 'X' : 'Y',
                _w_h: isHorizontal ? 'w' : 'h',
                _l_t: isHorizontal ? 'l' : 't',
                _track: isHorizontal ? _sHTE : _sVTE,
                _handle: isHorizontal ? _sHHE : _sVHE,
                _scrollbar: isHorizontal ? _sHE : _sVE,
                _info: isHorizontal ? _scrollHorizontalInfo : _scrollVerticalInfo
            };
        }

        //==== Utils ====//
        function setTopRightBottomLeft(targetCSSObject, prefix, values) {
            prefix = prefix || '';
            values = values || ['', '', '', ''];

            targetCSSObject[prefix + 'top'] = values[0];
            targetCSSObject[prefix + 'right'] = values[1];
            targetCSSObject[prefix + 'bottom'] = values[2];
            targetCSSObject[prefix + 'left'] = values[3];
        }
        function getTopRightBottomLeftHost(prefix, suffix, zeroX, zeroY) {
            suffix = suffix || '';
            prefix = prefix || '';
            return {
                t: zeroY ? 0 : parseToZeroOrNumber(_hostElement.css(prefix + 'top' + suffix)),
                r: zeroX ? 0 : parseToZeroOrNumber(_hostElement.css(prefix + 'right' + suffix)),
                b: zeroY ? 0 : parseToZeroOrNumber(_hostElement.css(prefix + 'bottom' + suffix)),
                l: zeroX ? 0 : parseToZeroOrNumber(_hostElement.css(prefix + 'left' + suffix))
            };
        }
        function isHTMLElement(o) {
            var strOwnerDocument = 'ownerDocument';
            var strHTMLElement = 'HTMLElement';
            var wnd = o && o[strOwnerDocument] ? (o[strOwnerDocument].parentWindow || window) : window;
            return (
                typeof wnd[strHTMLElement] == 'object' ? o instanceof wnd[strHTMLElement] : //DOM2
                    o && typeof o == 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName == 'string'
            );
        }
        function parseToZeroOrNumber(value, toFloat) {
            var num = toFloat ? parseFloat(value) : parseInt(value, 10);
            return isNaN(num) ? 0 : num;
        }
        function getContentMeasureElement() {
            return _contentElementNative;
        }
        function generateDiv(classesOrAttrs, content) {
            return '<div ' + (classesOrAttrs ? type(classesOrAttrs) == 'string' ?
                'class="' + classesOrAttrs + '"' :
                (function () {
                    var key;
                    var attrs = '';
                    if (Utils.isPlainObject(classesOrAttrs)) {
                        for (key in classesOrAttrs)
                            attrs += (key === 'c' ? 'class' : key) + '="' + classesOrAttrs[key] + '" ';
                    }
                    return attrs;
                })() :
                '') +
                '>' +
                (content || '') +
                '</div>';
        }
        function selectOrGenerateDivByClass(className, selectParentOrOnlyChildren) {
            var onlyChildren = type(selectParentOrOnlyChildren) == 'boolean';
            var selectParent = onlyChildren ? _hostElement : (selectParentOrOnlyChildren || _hostElement);

            return (_domExists && !selectParent.length)
                ? null
                : _domExists
                    ? selectParent[onlyChildren ? 'children' : 'find']('.' + className.replace(/\s/g, '.')).eq(0)
                    : Utils(generateDiv(className))
        }
        function eachUpdateOnLoad(action) {
            var updateOnLoad = _currentPreparedOptions.updateOnLoad;
            updateOnLoad = type(updateOnLoad) == 'string' ? updateOnLoad.split(' ') : updateOnLoad;

            if (COMPAT.isA(updateOnLoad)) {
                each(updateOnLoad, action);
            }
        }

        //==== Utils Cache ====//
        function checkCache(current, cache, force) {
            if (force) return force;
            if (type(current) == 'object' && type(cache) == 'object') {
                for (var prop in current) {
                    if (prop !== 'c') {
                        if (current.hasOwnProperty(prop) && cache.hasOwnProperty(prop)) {
                            if (checkCache(current[prop], cache[prop]))
                                return true;
                        }
                        else {
                            return true;
                        }
                    }
                }
            }
            else {
                return current !== cache;
            }
            return false;
        }

        //==== Shortcuts ====//
        function extendDeep() {
            return Utils.extend.apply(this, [true].concat([].slice.call(arguments)));
        }
        function addClass(el, classes) {
            return _frameworkProto.addClass.call(el, classes);
        }
        function removeClass(el, classes) {
            return _frameworkProto.removeClass.call(el, classes);
        }
        function addRemoveClass(el, classes, doAdd) {
            return doAdd ? addClass(el, classes) : removeClass(el, classes);
        }
        function remove(el) {
            return _frameworkProto.remove.call(el);
        }
        function findFirst(el, selector) {
            return _frameworkProto.find.call(el, selector).eq(0);
        }

        //==== API ====//
        _base.update = function (force) {
            var contentSizeC;
            var isString = type(force) == 'string';
            var doUpdateAuto;
            var mutHost;
            var mutContent;

            if (isString) {
                if (force === 'auto') {
                    contentSizeC = updateAutoContentSizeChanged();
                    doUpdateAuto = contentSizeC;
                    if (doUpdateAuto) {
                        update({
                            _contentSizeChanged: contentSizeC,
                            _changedOptions: _initialized ? undefined : _currentPreparedOptions
                        });
                    }
                }
                else if (force === _strSync) {
                    mutHost = _base.update('auto');
                }
                else if (force === 'zoom') {
                    update({
                        _hostSizeChanged: true,
                        _contentSizeChanged: true
                    });
                }
            }
            else {
                force = _sleeping || force;
                _sleeping = false;
                if (!_base.update(_strSync) || force)
                    update({ _force: force });
            }

            updateElementsOnLoad();

            return doUpdateAuto || mutHost || mutContent;
        };

        function construct(targetElement) {
            initOptions();
            _msieVersion = _globals.msie;
            _autoUpdateRecommended = _globals.autoUpdateRecommended;
            _supportPassiveEvents = _globals.supportPassiveEvents;
            _docE = Utils(targetElement.ownerDocument);
            _docENative = _docE[0];
            _wE = Utils(_docENative.defaultView || _docENative.parentWindow);
            _wENative = _wE[0];
            _htmlElement = findFirst(_docE, 'html');
            _bodyElement = findFirst(_htmlElement, 'body');
            _tE = Utils(targetElement);
            _isBody = _tE.is('body');
            _documentMixed = _docENative !== document;

            _domExists = _tE.hasClass(_classNameHostElement);

            var initBodyScroll;
            var bodyMouseTouchDownListener;

            if (_isBody) {
                initBodyScroll = {};
                initBodyScroll.l = Math.max(_tE['scrollLeft'](), _htmlElement['scrollLeft'](), _wE['scrollLeft']());
                initBodyScroll.t = Math.max(_tE['scrollTop'](), _htmlElement['scrollTop'](), _wE['scrollTop']());

                bodyMouseTouchDownListener = function () {
                    _viewportElement.removeAttr('tabindex');
                    setupResponsiveEventListener(_viewportElement, _strMouseTouchDownEvent, bodyMouseTouchDownListener, true, true);
                }
            }

            setupStructureDOM();
            setupScrollbarsDOM();

            setupStructureEvents();
            setupScrollbarEvents(true);
            setupScrollbarEvents(false);

            if (_isBody) {
                _viewportElement['scrollLeft'](initBodyScroll.l)['scrollTop'](initBodyScroll.t);
                if (document.activeElement == targetElement && _viewportElementNative.focus) {
                    _viewportElement.attr('tabindex', '-1');
                    _viewportElementNative.focus();

                    setupResponsiveEventListener(_viewportElement, _strMouseTouchDownEvent, bodyMouseTouchDownListener, false, true);
                }
            }
            _base.update('auto');
            _initialized = true;
            addClass(_hostElement, _classNameHostTransition);

            return _base;
        }

        construct(el);
        return {
            element: el,
            options: _currentOptions
        };
    }

    _base = {
        _objects: [],
        init: function() {
            if (!_globals) _globals = new scrollGlobals();

            var scrollEles = document.querySelectorAll('.co_overlay-scroll');
            for(var i = 0; i < scrollEles.length; i++){
                this.createObj(scrollEles[i]);
            }
        },
        checkExistObj: function(el) {
            for(var i = 0; i < this._objects.length; i++){
                if(el.isSameNode(this._objects[i].el)) return true;
            }
            return false;
        },
        createObj: function(el) {
            if(this.checkExistObj(el)) return;
            this._objects.push(new scrollInstance(el));
        }
    };

    return _base;
})();

CoCreateOverlayScroll.init();
