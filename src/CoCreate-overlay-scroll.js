// CoCreate OverlayScrollbar
function initOverlayScrollbars(){
    var scrollEles = document.querySelectorAll('.co_overlay-scroll');
    for(var i = 0; i < scrollEles.length; i++){
        var ele = scrollEles[i];
        var options = {};

        var scrollTheme = ele.dataset.overlayScroll_theme;
        if(typeof scrollTheme !== 'undefined'){
            options.className = 'co_theme-' + (scrollTheme == 'dark' ? 'dark' : 'light');
        }

        var scrollTypes = ele.dataset.overlayScroll_type;
        if(typeof scrollTypes !== 'undefined'){
            var isScrollX = false, isScrollY = false;

            if(scrollTypes.toLowerCase().indexOf('scrollx') > -1) isScrollX = true;
            if(scrollTypes.toLowerCase().indexOf('scrolly') > -1) isScrollY = true;

            if(isScrollX || isScrollY){
                options.overflowBehavior = {
                    x: isScrollX ? "scroll" : "hidden",
                    y: isScrollY ? "scroll" : "hidden",
                }
            }
        }

        var scrollVisible = ele.dataset.overlayScroll_visible;
        if(typeof scrollVisible !== 'undefined'){
            var _visible = scrollVisible.toLowerCase();
            options.scrollbars = {
                visibility: _visible == 'hide' ? 'hidden' : 'visible',
                autoHide: _visible == 'autohide' ? 'leave' : 'never',
                autoHideDelay : 100,
            };
        }
        
        OverlayScrollBarHandler(ele, options);
    }
}

var COSYMBOL = {
    c: 'class',
    s: 'style',
    i: 'id',
    l: 'length',
    p: 'prototype',
    ti: 'tabindex',
    oH: 'offsetHeight',
    cH: 'clientHeight',
    sH: 'scrollHeight',
    oW: 'offsetWidth',
    cW: 'clientWidth',
    sW: 'scrollWidth',
    hOP: 'hasOwnProperty',
    bCR: 'getBoundingClientRect'
};
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

            if (cssCache[COSYMBOL.hOP](name)) return result;

            var uppercasedName = firstLetterToUpper(name);
            var elmStyle = document.createElement('div')[COSYMBOL.s];
            var resultPossibilities;
            var i = 0;
            var v;
            var currVendorWithoutDashes;

            for (; i < cssPrefixes.length; i++) {
                currVendorWithoutDashes = cssPrefixes[i].replace(/-/g, '');
                resultPossibilities = [ name, cssPrefixes[i] + name, currVendorWithoutDashes + uppercasedName, firstLetterToUpper(currVendorWithoutDashes) + uppercasedName ];
                for (v = 0; v < resultPossibilities[COSYMBOL.l]; v++) {
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

            if (!jsCache[COSYMBOL.hOP](name)) {
                result = window[name];
                for (; i < jsPrefixes[COSYMBOL.l]; i++)
                    result = result || window[(isInterface ? jsPrefixes[i] : jsPrefixes[i].toLowerCase()) + firstLetterToUpper(name)];
                jsCache[name] = result;
            }
            return result || fallback;
        }
    }
})();
var COMPAT = (function () {
    function windowSize(x) {
        return x ? window.innerWidth || document.documentElement[COSYMBOL.cW] || document.body[COSYMBOL.cW] : window.innerHeight || document.documentElement[COSYMBOL.cH] || document.body[COSYMBOL.cH];
    }
    function bind(func, thisObj) {
        if (typeof func != 'function') {
            throw "Can't bind function!";
        }
        var proto = COSYMBOL.p;
        var aArgs = Array[proto].slice.call(arguments, 2);
        var fNOP = function () { };
        var fBound = function () { return func.apply(this instanceof fNOP ? this : thisObj, aArgs.concat(Array[proto].slice.call(arguments))); };

        if (func[proto]) fNOP[proto] = func[proto]; 
        fBound[proto] = new fNOP();

        return fBound;
    }

    return {
        wW: bind(windowSize, 0, true),
        wH: bind(windowSize, 0),
        mO: bind(VENDOR._jsAPI, 0, 'MutationObserver', true),
        rAF: bind(VENDOR._jsAPI, 0, 'requestAnimationFrame', false, function (func) { return window.setTimeout(func, 1000 / 60); }),
        cAF: bind(VENDOR._jsAPI, 0, 'cancelAnimationFrame', false, function (id) { return window.clearTimeout(id); }),
        now: function () {
            return Date.now && Date.now() || new Date().getTime();
        },
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
            for (var i = 0; i < arr[COSYMBOL.l]; i++)
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
            return Object[COSYMBOL.p].toString.call(obj).replace(/^\[object (.+)\]$/, '$1').toLowerCase();
        },

        bind: bind
    }
})();
var EASING = (function () {
    var _em = {
        p: Math.PI,
        c: Math.cos,
        s: Math.sin,
        w: Math.pow,
        t: Math.sqrt,
        n: Math.asin,
        a: Math.abs,
        o: 1.70158
    };
    return {
        swing: function (x, t, b, c, d) { return 0.5 - _em.c(x * _em.p) / 2; },
        linear: function (x, t, b, c, d) { return x; },
        easeInQuad: function (x, t, b, c, d) { return c * (t /= d) * t + b; },
        easeOutQuad: function (x, t, b, c, d) { return -c * (t /= d) * (t - 2) + b; },
        easeInOutQuad: function (x, t, b, c, d) { return ((t /= d / 2) < 1) ? c / 2 * t * t + b : -c / 2 * ((--t) * (t - 2) - 1) + b; },
        easeInCubic: function (x, t, b, c, d) { return c * (t /= d) * t * t + b; },
        easeOutCubic: function (x, t, b, c, d) { return c * ((t = t / d - 1) * t * t + 1) + b; },
        easeInOutCubic: function (x, t, b, c, d) { return ((t /= d / 2) < 1) ? c / 2 * t * t * t + b : c / 2 * ((t -= 2) * t * t + 2) + b; },
        easeInQuart: function (x, t, b, c, d) { return c * (t /= d) * t * t * t + b; },
        easeOutQuart: function (x, t, b, c, d) { return -c * ((t = t / d - 1) * t * t * t - 1) + b; },
        easeInOutQuart: function (x, t, b, c, d) { return ((t /= d / 2) < 1) ? c / 2 * t * t * t * t + b : -c / 2 * ((t -= 2) * t * t * t - 2) + b; },
        easeInQuint: function (x, t, b, c, d) { return c * (t /= d) * t * t * t * t + b; },
        easeOutQuint: function (x, t, b, c, d) { return c * ((t = t / d - 1) * t * t * t * t + 1) + b; },
        easeInOutQuint: function (x, t, b, c, d) { return ((t /= d / 2) < 1) ? c / 2 * t * t * t * t * t + b : c / 2 * ((t -= 2) * t * t * t * t + 2) + b; },
        easeInSine: function (x, t, b, c, d) { return -c * _em.c(t / d * (_em.p / 2)) + c + b; },
        easeOutSine: function (x, t, b, c, d) { return c * _em.s(t / d * (_em.p / 2)) + b; },
        easeInOutSine: function (x, t, b, c, d) { return -c / 2 * (_em.c(_em.p * t / d) - 1) + b; },
        easeInExpo: function (x, t, b, c, d) { return (t == 0) ? b : c * _em.w(2, 10 * (t / d - 1)) + b; },
        easeOutExpo: function (x, t, b, c, d) {return (t == d) ? b + c : c * (-_em.w(2, -10 * t / d) + 1) + b; },
        easeInOutExpo: function (x, t, b, c, d) {
            if (t == 0) return b;
            if (t == d) return b + c;
            if ((t /= d / 2) < 1) return c / 2 * _em.w(2, 10 * (t - 1)) + b;
            return c / 2 * (-_em.w(2, -10 * --t) + 2) + b;
        },
        easeInCirc: function (x, t, b, c, d) { return -c * (_em.t(1 - (t /= d) * t) - 1) + b; },
        easeOutCirc: function (x, t, b, c, d) { return c * _em.t(1 - (t = t / d - 1) * t) + b; },
        easeInOutCirc: function (x, t, b, c, d) { return ((t /= d / 2) < 1) ? -c / 2 * (_em.t(1 - t * t) - 1) + b : c / 2 * (_em.t(1 - (t -= 2) * t) + 1) + b; },
        easeInElastic: function (x, t, b, c, d) {
            var s = _em.o; var p = 0; var a = c;
            if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
            if (a < _em.a(c)) { a = c; s = p / 4; }
            else s = p / (2 * _em.p) * _em.n(c / a);
            return -(a * _em.w(2, 10 * (t -= 1)) * _em.s((t * d - s) * (2 * _em.p) / p)) + b;
        },
        easeOutElastic: function (x, t, b, c, d) {
            var s = _em.o; var p = 0; var a = c;
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (a < _em.a(c)) { a = c; s = p / 4; }
            else s = p / (2 * _em.p) * _em.n(c / a);
            return a * _em.w(2, -10 * t) * _em.s((t * d - s) * (2 * _em.p) / p) + c + b;
        },
        easeInOutElastic: function (x, t, b, c, d) {
            var s = _em.o; var p = 0; var a = c;
            if (t == 0) return b;
            if ((t /= d / 2) == 2) return b + c;
            if (!p) p = d * (.3 * 1.5);
            if (a < _em.a(c)) { a = c; s = p / 4; }
            else s = p / (2 * _em.p) * _em.n(c / a);
            if (t < 1) return -.5 * (a * _em.w(2, 10 * (t -= 1)) * _em.s((t * d - s) * (2 * _em.p) / p)) + b;
            return a * _em.w(2, -10 * (t -= 1)) * _em.s((t * d - s) * (2 * _em.p) / p) * .5 + c + b;
        },
        easeInBack: function (x, t, b, c, d, s) {
            s = s || _em.o;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        },
        easeOutBack: function (x, t, b, c, d, s) {
            s = s || _em.o;
            return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        },
        easeInOutBack: function (x, t, b, c, d, s) {
            s = s || _em.o;
            return ((t /= d / 2) < 1) ? c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b : c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
        },
        easeInBounce: function (x, t, b, c, d) { return c - this.easeOutBounce(x, d - t, 0, c, d) + b; },
        easeOutBounce: function (x, t, b, c, d) {
            var o = 7.5625;
            if ((t /= d) < (1 / 2.75)) {
                return c * (o * t * t) + b;
            } else if (t < (2 / 2.75)) {
                return c * (o * (t -= (1.5 / 2.75)) * t + .75) + b;
            } else if (t < (2.5 / 2.75)) {
                return c * (o * (t -= (2.25 / 2.75)) * t + .9375) + b;
            } else {
                return c * (o * (t -= (2.625 / 2.75)) * t + .984375) + b;
            }
        },
        easeInOutBounce: function (x, t, b, c, d) { return (t < d / 2) ? this.easeInBounce(x, t * 2, 0, c, d) * .5 + b : this.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b; }
    };
})();

var OverlayScrollBarUtils = (function () {
    var _rnothtmlwhite = (/[^\x20\t\r\n\f]+/g);
    var _animations = [];
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
        var src, copyIsArray, copy, name, options, clone, target = arguments[0] || {}, i = 1, length = arguments[COSYMBOL.l], deep = false;

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
        for (var i = fromIndex || 0; i < arr[COSYMBOL.l]; i++)
            if (arr[i] === item)
                return i;
        return -1;
    }

    function isFunction(obj) {
        return _type(obj) == 'function';
    };

    function isEmptyObject(obj) {
        for (var name in obj) return false;
        return true;
    };

    function isPlainObject(obj) {
        if (!obj || _type(obj) != 'object') return false;

        var key;
        var proto = COSYMBOL.p;
        var hasOwnProperty = Object[proto].hasOwnProperty;
        var hasOwnConstructor = hasOwnProperty.call(obj, 'constructor');
        var hasIsPrototypeOf = obj.constructor && obj.constructor[proto] && hasOwnProperty.call(obj.constructor[proto], 'isPrototypeOf');

        if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
            return false;
        }

        for (key in obj) { /**/ }

        return _type(key) == 'undefined' || hasOwnProperty.call(obj, key);
    };

    function each(obj, callback) {
        var i = 0;

        if (isArrayLike(obj)) {
            for (; i < obj[COSYMBOL.l]; i++) {
                if (callback.call(obj[i], i, obj[i]) === false)
                    break;
            }
        }
        else {
            for (i in obj) {
                if (callback.call(obj[i], i, obj[i]) === false)
                    break;
            }
        }

        return obj;
    };

    function isArrayLike(obj) {
        var length = !!obj && [COSYMBOL.l] in obj && obj[COSYMBOL.l];
        var t = _type(obj);
        return isFunction(t) ? false : (t == 'array' || length === 0 || _type(length) == 'number' && length > 0 && (length - 1) in obj);
    }

    function stripAndCollapse(value) {
        var tokens = value.match(_rnothtmlwhite) || [];
        return tokens.join(' ');
    }

    function matches(elem, selector) {
        var nodeList = (elem.parentNode || document).querySelectorAll(selector) || [];
        var i = nodeList[COSYMBOL.l];

        while (i--)
            if (nodeList[i] == elem)
                return true;

        return false;
    }

    function insertAdjacentElement(el, strategy, child) {
        if (COMPAT.isA(child)) {
            for (var i = 0; i < child[COSYMBOL.l]; i++) insertAdjacentElement(el, strategy, child[i]);
        }
        else if (_type(child) == 'string') el.insertAdjacentHTML(strategy, child);
        else el.insertAdjacentElement(strategy, child.nodeType ? child : child[0]);
    }

    function setCSSVal(el, prop, val) {
        try {
            if (el[COSYMBOL.s][prop] !== undefined) el[COSYMBOL.s][prop] = parseCSSVal(prop, val);
        } catch (e) { }
    }

    function parseCSSVal(prop, val) {
        if (!_cssNumber[prop.toLowerCase()] && _type(val) == 'number')
            val += 'px';
        return val;
    }

    function startNextAnimationInQ(animObj, removeFromQ) {
        var index;
        var nextAnim;
        if (removeFromQ !== false)
            animObj.q.splice(0, 1);
        if (animObj.q[COSYMBOL.l] > 0) {
            nextAnim = animObj.q[0];
            animate(animObj.el, nextAnim.props, nextAnim.duration, nextAnim.easing, nextAnim.complete, true);
        }
        else {
            index = inArray(animObj, _animations);
            if (index > -1)
                _animations.splice(index, 1);
        }
    }

    function setAnimationValue(el, prop, value) {
        if (prop === 'scrollLeft' || prop === 'scrollTop')
            el[prop] = value;
        else
            setCSSVal(el, prop, value);
    }

    function animate(el, props, options, easing, complete, guaranteedNext) {
        var hasOptions = isPlainObject(options);
        var from = {};
        var to = {};
        var i = 0;
        var key;
        var animObj;
        var start;
        var progress;
        var step;
        var specialEasing;
        var duration;
        if (hasOptions) {
            easing = options.easing;
            start = options.start;
            progress = options.progress;
            step = options.step;
            specialEasing = options.specialEasing;
            complete = options.complete;
            duration = options.duration;
        }
        else
            duration = options;
        specialEasing = specialEasing || {};
        duration = duration || 400;
        easing = easing || 'swing';
        guaranteedNext = guaranteedNext || false;

        for (; i < _animations[COSYMBOL.l]; i++) {
            if (_animations[i].el === el) {
                animObj = _animations[i];
                break;
            }
        }

        if (!animObj) {
            animObj = {
                el: el,
                q: []
            };
            _animations.push(animObj);
        }

        for (key in props) {
            if (key === 'scrollLeft' || key === 'scrollTop')
                from[key] = el[key];
            else
                from[key] = FakejQuery(el).css(key);
        }

        for (key in from) {
            if (from[key] !== props[key] && props[key] !== undefined)
                to[key] = props[key];
        }

        if (!isEmptyObject(to)) {
            var timeNow;
            var end;
            var percent;
            var fromVal;
            var toVal;
            var easedVal;
            var timeStart;
            var frame;
            var elapsed;
            var qPos = guaranteedNext ? 0 : inArray(qObj, animObj.q);
            var qObj = {
                props: to,
                duration: hasOptions ? options : duration,
                easing: easing,
                complete: complete
            };
            if (qPos === -1) {
                qPos = animObj.q[COSYMBOL.l];
                animObj.q.push(qObj);
            }

            if (qPos === 0) {
                if (duration > 0) {
                    timeStart = COMPAT.now();
                    frame = function () {
                        timeNow = COMPAT.now();
                        elapsed = (timeNow - timeStart);
                        end = qObj.stop || elapsed >= duration;
                        percent = 1 - ((Math.max(0, timeStart + duration - timeNow) / duration) || 0);

                        for (key in to) {
                            fromVal = parseFloat(from[key]);
                            toVal = parseFloat(to[key]);
                            easedVal = (toVal - fromVal) * EASING[specialEasing[key] || easing](percent, percent * duration, 0, 1, duration) + fromVal;
                            setAnimationValue(el, key, easedVal);
                            if (isFunction(step)) {
                                step(easedVal, {
                                    elem: el,
                                    prop: key,
                                    start: fromVal,
                                    now: easedVal,
                                    end: toVal,
                                    pos: percent,
                                    options: {
                                        easing: easing,
                                        speacialEasing: specialEasing,
                                        duration: duration,
                                        complete: complete,
                                        step: step
                                    },
                                    startTime: timeStart
                                });
                            }
                        }

                        if (isFunction(progress))
                            progress({}, percent, Math.max(0, duration - elapsed));

                        if (end) {
                            startNextAnimationInQ(animObj);
                            if (isFunction(complete))
                                complete();
                        }
                        else
                            qObj.frame = COMPAT.rAF()(frame);
                    };
                    qObj.frame = COMPAT.rAF()(frame);
                }
                else {
                    for (key in to)
                        setAnimationValue(el, key, to[key]);
                    startNextAnimationInQ(animObj);
                }
            }
        }
        else if (guaranteedNext)
            startNextAnimationInQ(animObj);
    }

    function stop(el, clearQ, jumpToEnd) {
        var animObj;
        var qObj;
        var key;
        var i = 0;
        for (; i < _animations[COSYMBOL.l]; i++) {
            animObj = _animations[i];
            if (animObj.el === el) {
                if (animObj.q[COSYMBOL.l] > 0) {
                    qObj = animObj.q[0];
                    qObj.stop = true;
                    COMPAT.cAF()(qObj.frame);
                    animObj.q.splice(0, 1);

                    if (jumpToEnd)
                        for (key in qObj.props)
                            setAnimationValue(el, key, qObj.props[key]);

                    if (clearQ)
                        animObj.q = [];
                    else
                        startNextAnimationInQ(animObj, false);
                }
                break;
            }
        }
    }

    function elementIsVisible(el) {
        return !!(el[COSYMBOL.oW] || el[COSYMBOL.oH] || el.getClientRects()[COSYMBOL.l]);
    }

    function FakejQuery(selector) {
        if (arguments[COSYMBOL.l] === 0)
            return this;

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
            }
            else {
                elms = document.querySelectorAll(selector);
            }

            for (; i < elms[COSYMBOL.l]; i++)
                elements.push(elms[i]);
        }

        if (elements) {
            if (_type(elements) != 'string' && (!isArrayLike(elements) || elements === window || elements === elements.self))
                elements = [elements];

            for (i = 0; i < elements[COSYMBOL.l]; i++)
                base[i] = elements[i];

            base[COSYMBOL.l] = elements[COSYMBOL.l];
        }

        return base;
    };

    FakejQuery[COSYMBOL.p] = {
        on: function (eventName, handler) {
            eventName = (eventName || '').match(_rnothtmlwhite) || [''];
            var eventNameLength = eventName[COSYMBOL.l];
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

            var eventNameLength = eventName[COSYMBOL.l];
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
                }
                else {
                    el.fireEvent('on' + eventName);
                }
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
                if (inArray(parent, parents) === - 1)
                    parents.push(parent);
            });

            for (i = 0; i < parents[COSYMBOL.l]; i++) {
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
            while (deepest.childNodes[COSYMBOL.l] > 0)
                deepest = deepest.childNodes[0];

            for (i = 0; nodes[COSYMBOL.l] - i; deepest.firstChild === nodes[0] && i++)
                deepest.appendChild(nodes[i]);

            var nextSibling = previousSibling ? previousSibling.nextSibling : parent.firstChild;
            parent.insertBefore(wrapper, nextSibling);

            return this;
        },

        wrapInner: function (wrapperHTML) {
            return this.each(function () {
                var el = FakejQuery(this);
                var contents = el.contents();

                if (contents[COSYMBOL.l])
                    contents.wrapAll(wrapperHTML);
                else
                    el.append(wrapperHTML);
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
                    return getCptStyle ? cptStyle != null ? cptStyle.getPropertyValue(styles) : el[COSYMBOL.s][styles] : cptStyle;
                }
                else {
                    return this.each(function () {
                        setCSSVal(this, styles, val);
                    });
                }
            }
            else {
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
                if (classList && classList.contains(className))
                    return true;
                else if (elem.nodeType === 1 && (' ' + stripAndCollapse(elem.className + '') + ' ').indexOf(classNamePrepared) > -1)
                    return true;
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
                    if (supportClassList === undefined)
                        supportClassList = elmClassList !== undefined;

                    if (supportClassList) {
                        while ((clazz = classes[v++]))
                            elmClassList.add(clazz);
                    }
                    else {
                        curValue = elem.className + '';
                        cur = elem.nodeType === 1 && (' ' + stripAndCollapse(curValue) + ' ');

                        if (cur) {
                            while ((clazz = classes[v++]))
                                if (cur.indexOf(' ' + clazz + ' ') < 0)
                                    cur += clazz + ' ';

                            finalValue = stripAndCollapse(cur);
                            if (curValue !== finalValue)
                                elem.className = finalValue;
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
                    if (supportClassList === undefined)
                        supportClassList = elmClassList !== undefined;

                    if (supportClassList) {
                        while ((clazz = classes[v++]))
                            elmClassList.remove(clazz);
                    }
                    else {
                        curValue = elem.className + '';
                        cur = elem.nodeType === 1 && (' ' + stripAndCollapse(curValue) + ' ');

                        if (cur) {
                            while ((clazz = classes[v++]))
                                while (cur.indexOf(' ' + clazz + ' ') > -1)
                                    cur = cur.replace(' ' + clazz + ' ', ' ');

                            finalValue = stripAndCollapse(cur);
                            if (curValue !== finalValue)
                                elem.className = finalValue;
                        }
                    }
                }
            }

            return this;
        },

        hide: function () {
            return this.each(function () { this[COSYMBOL.s].display = 'none'; });
        },

        show: function () {
            return this.each(function () { this[COSYMBOL.s].display = 'block'; });
        },

        attr: function (attrName, value) {
            var i = 0;
            var el;
            while (el = this[i++]) {
                if (value === undefined)
                    return el.getAttribute(attrName);
                el.setAttribute(attrName, value);
            }
            return this;
        },

        removeAttr: function (attrName) {
            return this.each(function () { this.removeAttribute(attrName); });
        },

        offset: function () {
            var el = this[0];
            var rect = el[COSYMBOL.bCR]();
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
                if (value === undefined)
                    return el['scrollLeft'];
                el['scrollLeft'] = value;
            }
            return this;
        },

        scrollTop: function (value) {
            var i = 0;
            var el;
            while (el = this[i++]) {
                if (value === undefined)
                    return el['scrollTop'];
                el['scrollTop'] = value;
            }
            return this;
        },

        val: function (value) {
            var el = this[0];
            if (!value)
                return el.value;
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
            return FakejQuery(this[index >= 0 ? index : this[COSYMBOL.l] + index]);
        },

        find: function (selector) {
            var children = [];
            var i;
            this.each(function () {
                var el = this;
                var ch = el.querySelectorAll(selector);
                for (i = 0; i < ch[COSYMBOL.l]; i++)
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
                for (i = 0; i < ch[COSYMBOL.l]; i++) {
                    el = ch[i];
                    if (selector) {
                        if ((el.matches && el.matches(selector)) || matches(el, selector))
                            children.push(el);
                    }
                    else
                        children.push(el);
                }
            });
            return FakejQuery(children);
        },

        parent: function (selector) {
            var parents = [];
            var parent;
            this.each(function () {
                parent = this.parentNode;
                if (selector ? FakejQuery(parent).is(selector) : true)
                    parents.push(parent);
            });
            return FakejQuery(parents);
        },

        is: function (selector) {

            var el;
            var i;
            for (i = 0; i < this[COSYMBOL.l]; i++) {
                el = this[i];
                if (selector === ':visible')
                    return elementIsVisible(el);
                if (selector === ':hidden')
                    return !elementIsVisible(el);
                if ((el.matches && el.matches(selector)) || matches(el, selector))
                    return true;
            }
            return false;
        },

        contents: function () {
            var contents = [];
            var childs;
            var i;

            this.each(function () {
                childs = this.childNodes;
                for (i = 0; i < childs[COSYMBOL.l]; i++)
                    contents.push(childs[i]);
            });

            return FakejQuery(contents);
        },

        each: function (callback) {
            return each(this, callback);
        },

        animate: function (props, duration, easing, complete) {
            return this.each(function () { animate(this, props, duration, easing, complete); });
        },

        stop: function (clearQ, jump) {
            return this.each(function () { stop(this, clearQ, jump); });
        }
    };

    extend(FakejQuery, {
        extend: extend,
        inArray: inArray,
        isEmptyObject: isEmptyObject,
        isPlainObject: isPlainObject,
        each: each
    });

    return FakejQuery;
})();

var OverlayScrollBarInstances = (function () {
    var _targets = [];
    var _instancePropertyString = '__overlayScrollbars__';

    return function (target, instance) {
        var argLen = arguments[COSYMBOL.l];
        if (argLen < 1) return _targets;
        else {
            if (instance) {
                target[_instancePropertyString] = instance;
                _targets.push(target);
            }
            else {
                var index = COMPAT.inA(target, _targets);
                if (index > -1) {
                    if (argLen > 1) {
                        delete target[_instancePropertyString];
                        _targets.splice(index, 1);
                    }
                    else {
                        return _targets[index][_instancePropertyString];
                    }
                }
            }
        }
    }
})();

var OverlayScrollBarHandler = (function(){
    var _plugin;
    var _pluginsGlobals;
    var _pluginsOptions = (function () {
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
            scrollbars: {
                visibility: ['auto', hv],
                autoHide: ['never', sv],
                autoHideDelay: [800, 'number'],
                dragScrolling: [true, 'boolean'],
                clickScrolling: [false, 'boolean'],
                touchSupport: [true, 'boolean']
            },
        };
        var convert = function (template) {
            var recursive = function (obj) {
                var key;
                var val;
                var valType;
                for (key in obj) {
                    if (!obj[COSYMBOL.hOP](key)) continue;
                    val = obj[key];
                    valType = type(val);
                    if (valType == 'array') obj[key] = val[template ? 1 : 0];
                    else if (valType == 'object') obj[key] = recursive(val);
                }
                return obj;
            };
            return recursive(OverlayScrollBarUtils.extend(true, {}, optionsDefaults));
        };

        return {
            _defaults: convert(),
            _template: convert(true),
            _validate: function (obj, template, diffObj) {
                var validatedOptions = {};
                var validatedOptionsPrepared = {};
                var objectCopy = OverlayScrollBarUtils.extend(true, {}, obj);
                var inArray = OverlayScrollBarUtils.inArray;
                var isEmptyObj = OverlayScrollBarUtils.isEmptyObject;
                var checkObjectProps = function (data, template, diffData, validatedOptions, validatedOptionsPrepared, prevPropName) {
                    for (var prop in template) {
                        if (template[COSYMBOL.hOP](prop) && data[COSYMBOL.hOP](prop)) {
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
                                OverlayScrollBarUtils.each([data, validatedOptions, validatedOptionsPrepared], function (index, value) {
                                    if (isEmptyObj(value[prop])) {
                                        delete value[prop];
                                    }
                                });
                            }
                            else if (!templateIsComplex) {
                                for (i = 0; i < templateTypes[COSYMBOL.l]; i++) {
                                    currType = templateTypes[i];
                                    templateValueType = type(currType);
                                    isRestrictedValue = templateValueType == 'string' && inArray(currType, possibleTypes) === -1;
                                    if (isRestrictedValue) {
                                        restrictSVS = currType.split(' ');
                                        for (v = 0; v < restrictSVS[COSYMBOL.l]; v++) {
                                            restrictSVPS = restrictSVS[v].split(':');
                                            mainPossibility = restrictSVPS[0];
                                            for (j = 0; j < restrictSVPS[COSYMBOL.l]; j++) {
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

    function initOverlayScrollbarsStatics() {
        if (!_pluginsGlobals) _pluginsGlobals = new OverlayScrollbarsGlobals(_pluginsOptions._defaults);
    }

    function OverlayScrollbarsGlobals(defaultOptions) {
        var _base = this;
        var bodyElement = OverlayScrollBarUtils('body');
        var scrollbarDummyElement = OverlayScrollBarUtils('<div id="os-dummy-scrollbar-size"><div></div></div>');
        var scrollbarDummyElement0 = scrollbarDummyElement[0];

        bodyElement.append(scrollbarDummyElement);
        scrollbarDummyElement.hide().show(); 

        var nativeScrollbarSize = calcNativeScrollbarSize(scrollbarDummyElement0);
        var msie = (function () {
            var ua = window.navigator.userAgent;
            var strIndexOf = 'indexOf';
            var strSubString = 'substring';
            var msie = ua[strIndexOf]('MSIE ');
            var trident = ua[strIndexOf]('Trident/');
            var edge = ua[strIndexOf]('Edge/');
            var rv = ua[strIndexOf]('rv:');
            var result;
            var parseIntFunc = parseInt;

            if (msie > 0) result = parseIntFunc(ua[strSubString](msie + 5, ua[strIndexOf]('.', msie)), 10);
            else if (trident > 0) result = parseIntFunc(ua[strSubString](rv + 3, ua[strIndexOf]('.', rv)), 10);
            else if (edge > 0) result = parseIntFunc(ua[strSubString](edge + 5, ua[strIndexOf]('.', edge)), 10);

            return result;
        })();

        OverlayScrollBarUtils.extend(_base, {
            defaultOptions: defaultOptions,
            msie: msie,
            autoUpdateLoop: false,
            autoUpdateRecommended: false,
            nativeScrollbarSize: nativeScrollbarSize,
            overlayScrollbarDummySize: { x: 30, y: 30 },
            supportTransform: !!VENDOR._cssProperty('transform'),
            supportTransition: !!VENDOR._cssProperty('transition'),
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

        scrollbarDummyElement.removeAttr(COSYMBOL.s).remove();

        (function () {
            var abs = Math.abs;
            var windowWidth = COMPAT.wW();
            var windowHeight = COMPAT.wH();
            var windowDpr = getWindowDPR();
            var onResize = function () {
                if (OverlayScrollBarInstances().length > 0) {
                    var newW = COMPAT.wW();
                    var newH = COMPAT.wH();
                    var deltaW = newW - windowWidth;
                    var deltaH = newH - windowHeight;

                    if (deltaW === 0 && deltaH === 0) return;

                    var deltaWRatio = Math.round(newW / (windowWidth / 100.0));
                    var deltaHRatio = Math.round(newH / (windowHeight / 100.0));
                    var absDeltaW = abs(deltaW);
                    var absDeltaH = abs(deltaH);
                    var absDeltaWRatio = abs(deltaWRatio);
                    var absDeltaHRatio = abs(deltaHRatio);
                    var newDPR = getWindowDPR();

                    var deltaIsBigger = absDeltaW > 2 && absDeltaH > 2;
                    var difference = !differenceIsBiggerThanOne(absDeltaWRatio, absDeltaHRatio);
                    var dprChanged = newDPR !== windowDpr && windowDpr > 0;
                    var isZoom = deltaIsBigger && difference && dprChanged;
                    var oldScrollbarSize = _base.nativeScrollbarSize;
                    var newScrollbarSize;

                    if (isZoom) {
                        bodyElement.append(scrollbarDummyElement);
                        newScrollbarSize = _base.nativeScrollbarSize = calcNativeScrollbarSize(scrollbarDummyElement[0]);
                        scrollbarDummyElement.remove();
                        if (oldScrollbarSize.x !== newScrollbarSize.x || oldScrollbarSize.y !== newScrollbarSize.y) {
                            OverlayScrollBarUtils.each(OverlayScrollBarInstances(), function () {
                                if (OverlayScrollBarInstances(this)) OverlayScrollBarInstances(this).update('zoom');
                            });
                        }
                    }

                    windowWidth = newW;
                    windowHeight = newH;
                    windowDpr = newDPR;
                }
            };

            function differenceIsBiggerThanOne(valOne, valTwo) {
                var absValOne = abs(valOne);
                var absValTwo = abs(valTwo);
                return !(absValOne === absValTwo || absValOne + 1 === absValTwo || absValOne - 1 === absValTwo);
            }

            function getWindowDPR() {
                var dDPI = window.screen.deviceXDPI || 0;
                var sDPI = window.screen.logicalXDPI || 1;
                return window.devicePixelRatio || (dDPI / sDPI);
            }

            OverlayScrollBarUtils(window).on('resize', onResize);
        })();

        function calcNativeScrollbarSize(measureElement) {
            return {
                x: measureElement[COSYMBOL.oH] - measureElement[COSYMBOL.cH],
                y: measureElement[COSYMBOL.oW] - measureElement[COSYMBOL.cW]
            };
        }
    }
    
    function OverlayScrollbarsInstance(pluginTargetElement, options, globals) {
        var type = COMPAT.type;
        var each = OverlayScrollBarUtils.each;
        var _base = new _plugin();
        var _frameworkProto = OverlayScrollBarUtils[COSYMBOL.p];

        if (!isHTMLElement(pluginTargetElement)) return;
        if (OverlayScrollBarInstances(pluginTargetElement)) {
            var inst = OverlayScrollBarInstances(pluginTargetElement);
            inst.options(options);
            return inst;
        }

        var _msieVersion;
        var _supportTransition;
        var _supportTransform;
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
        var _strTransitionEndEvent = 'transitionend webkitTransitionEnd oTransitionEnd';

        var _cassNamesPrefix = 'co_';
        var _classNameHTMLElement = _cassNamesPrefix + 'html';
        var _classNameHostElement = _cassNamesPrefix + 'host';
        var _classNameHostElementForeign = _classNameHostElement + '-foreign';
        var _cHH = _classNameHostElement + '-' + _strScrollbar + _strMinusHorizontal + _strMinusHidden;
        var _cVH = _classNameHostElement + '-' + _strScrollbar + _strMinusVertical + _strMinusHidden;
        var _classNameHostTransition = _classNameHostElement + '-transition';
        var _classNameHostScrolling = _classNameHostElement + '-scrolling';
        var _classNamePaddingElement = _cassNamesPrefix + 'wrapper';
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

        var _viewportAttrsFromTarget = [COSYMBOL.ti];

        var _defaultOptions;
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
        var _tE;                     //the target element of this OverlayScrollbars object	
        var _hostElement;                       //the host element of this OverlayScrollbars object -> may be the same as targetElement	
        var _paddingElement;                    //manages the padding	
        var _viewportElement;                   //is the viewport of our scrollbar model	
        var _contentElement;                    //the element which holds the content	
        var _contentArrangeElement;             //is needed for correct sizing of the content element (only if native scrollbars are overlays)	
        var _sHE;
        var _sHTE;
        var _sHHE;
        var _sVE;
        var _sVTE;
        var _sVHE;
        var _wENative;
        var _docENative;
        var _hostElementNative;
        var _paddingElementNative;
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

        //==== Event Listener ====//	

        function setupResponsiveEventListener(element, eventNames, listener, remove, passiveOrOptions) {
            var collected = COMPAT.isA(eventNames) && COMPAT.isA(listener);
            var method = remove ? 'removeEventListener' : 'addEventListener';
            var onOff = remove ? 'off' : 'on';
            var events = collected ? false : eventNames.split(' ')
            var i = 0;

            var passiveOrOptionsIsObj = OverlayScrollBarUtils.isPlainObject(passiveOrOptions);
            var passive = _supportPassiveEvents && (passiveOrOptionsIsObj ? (passiveOrOptions._passive || false) : passiveOrOptions);
            var capture = passiveOrOptionsIsObj && (passiveOrOptions._capture || false);
            var useNative = capture || passive;
            var nativeParam = passive ? {
                passive: passive,
                capture: capture,
            } : capture;

            if (collected) {
                for (; i < eventNames[COSYMBOL.l]; i++)
                    setupResponsiveEventListener(element, eventNames[i], listener[i], remove, passiveOrOptions);
            }
            else {
                for (; i < events[COSYMBOL.l]; i++) {
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
            if (_scrollbarsAutoHideLeave && !_bodyElement.hasClass(_classNameDragging))
                refreshScrollbarsAutoHide(false);
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
            var elm = OverlayScrollBarUtils(event.target);

            eachUpdateOnLoad(function (i, updateOnLoadSelector) {
                if (elm.is(updateOnLoadSelector)) {
                    update({ _contentSizeChanged: true });
                }
            });
        }

        function setupHostMouseTouchEvents(destroy) {
            if (!destroy)
                setupHostMouseTouchEvents(true);

            setupResponsiveEventListener(_hostElement,
                _strMouseTouchMoveEvent.split(' ')[0],
                hostOnMouseMove,
                (!_scrollbarsAutoHideMove || destroy), true);
            setupResponsiveEventListener(_hostElement,
                [_strMouseEnter, _strMouseLeave],
                [hostOnMouseEnter, hostOnMouseLeave],
                (!_scrollbarsAutoHideLeave || destroy), true);

            //if the plugin is initialized and the mouse is over the host element, make the scrollbars visible
            if (!_initialized && !destroy)
                _hostElement.one('mouseover', hostOnMouseEnter);
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
                w: contentMeasureElement[COSYMBOL.sW],
                h: contentMeasureElement[COSYMBOL.sH]
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

        function isSizeAffectingCSSProperty(propertyName) {
            if (!_initialized)
                return true;
            var flexGrow = 'flex-grow';
            var flexShrink = 'flex-shrink';
            var flexBasis = 'flex-basis';
            var a_PropX = [
                'width',
                _strMinMinus + 'width',
                _strMaxMinus + 'width',
                _strMarginMinus + 'left',
                _strMarginMinus + 'right',
                'left',
                'right',
                'font-weight',
                'word-spacing',
                flexGrow,
                flexShrink,
                flexBasis
            ];
            var a_PropXContentBox = [
                _sPadMins + 'left',
                _sPadMins + 'right',
                _sBordMins + 'left' + 'width',
                _sBordMins + 'right' + 'width'
            ];
            var a_PropY = [
                'height',
                _strMinMinus + 'height',
                _strMaxMinus + 'height',
                _strMarginMinus + 'top',
                _strMarginMinus + 'bottom',
                'top',
                'bottom',
                'line-height',
                flexGrow,
                flexShrink,
                flexBasis
            ];
            var a_PropYContentBox = [
                _sPadMins + 'top',
                _sPadMins + 'bottom',
                _sBordMins + 'top' + 'width',
                _sBordMins + 'bottom' + 'width'
            ];
            var _strS = 's';
            var _strVS = 'v-s';
            var checkX = _overflowBehaviorCache.x === _strS || _overflowBehaviorCache.x === _strVS;
            var checkY = _overflowBehaviorCache.y === _strS || _overflowBehaviorCache.y === _strVS;
            var sizeIsAffected = false;
            var checkPropertyName = function (arr, name) {
                for (var i = 0; i < arr[COSYMBOL.l]; i++) {
                    if (arr[i] === name)
                        return true;
                }
                return false;
            };

            if (checkY) {
                sizeIsAffected = checkPropertyName(a_PropY, propertyName);
                if (!sizeIsAffected && !_isBorderBox)
                    sizeIsAffected = checkPropertyName(a_PropYContentBox, propertyName);
            }
            if (checkX && !sizeIsAffected) {
                sizeIsAffected = checkPropertyName(a_PropX, propertyName);
                if (!sizeIsAffected && !_isBorderBox)
                    sizeIsAffected = checkPropertyName(a_PropXContentBox, propertyName);
            }
            return sizeIsAffected;
        }

        //==== Update ====//

        function updateViewportAttrsFromTarget(attrs) {
            attrs = attrs || _viewportAttrsFromTarget;
            each(attrs, function (index, attr) {
                if (COMPAT.inA(attr, _viewportAttrsFromTarget) > -1) {
                    var targetAttr = _tE.attr(attr);
                    if (type(targetAttr) == 'string') {
                        _viewportElement.attr(attr, targetAttr);
                    }
                    else {
                        _viewportElement.removeAttr(attr);
                    }
                }
            });
        }

        function update(updateHints) {
            clearTimeout(_swallowedUpdateTimeout);
            updateHints = updateHints || {};
            _swallowedUpdateHints._hostSizeChanged |= updateHints._hostSizeChanged;
            _swallowedUpdateHints._contentSizeChanged |= updateHints._contentSizeChanged;
            _swallowedUpdateHints._force |= updateHints._force;

            var now = COMPAT.now();
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
                    w: _hostElementNative[COSYMBOL.cW],
                    h: _hostElementNative[COSYMBOL.cH]
                };
            };
            var getViewportSize = function () {
                return {
                    w: _paddingElementNative[COSYMBOL.oW] + Math.max(0, _contentElementNative[COSYMBOL.cW] - _contentElementNative[COSYMBOL.sW]),
                    h: _paddingElementNative[COSYMBOL.oH] + Math.max(0, _contentElementNative[COSYMBOL.cH] - _contentElementNative[COSYMBOL.sH])
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
                var paddingElementCSS = {};
                var paddingValues = [padding.t, padding.r, padding.b, padding.l];

                setTopRightBottomLeft(paddingElementCSS, '');
                setTopRightBottomLeft(contentElementCSS, _sPadMins, paddingValues);

                _paddingElement.css(paddingElementCSS);
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
                    w: contentMeasureElement[COSYMBOL.sW],
                    h: contentMeasureElement[COSYMBOL.sH],
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
                var viewportRect = _paddingElementNative[COSYMBOL.bCR]();
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
                var paddingElementCSS = {};
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

                    _paddingElement.css(paddingElementCSS);
                    _viewportElement.css(v_EC);
                    v_EC = {};

                    if ((hasOverflow.c || boxSizingChanged )) {
                        var elementStyle = _contentElementNative[COSYMBOL.s];
                        var dump;
                        elementStyle.webkitTransform = 'scale(1)';
                        elementStyle.display = 'run-in';
                        dump = _contentElementNative[COSYMBOL.oH];
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
                        OverlayScrollBarUtils(el)
                            .off(_updateOnLoadEventName, updateOnLoadCallback)
                            .on(_updateOnLoadEventName, updateOnLoadCallback);
                    }
                });
            });
        }

        //==== Options ====//

        function setOptions(newOptions) {
            var validatedOpts = _pluginsOptions._validate(newOptions, _pluginsOptions._template, _currentOptions)
            _currentOptions = extendDeep({}, _currentOptions, validatedOpts._default);
            _currentPreparedOptions = extendDeep({}, _currentPreparedOptions, validatedOpts._prepared);
            return validatedOpts._prepared;
        }

        //==== Structure ====//

        function setupStructureDOM() {
            _hostElement = _hostElement || _tE;
            _contentElement = _contentElement || selectOrGenerateDivByClass(_classNameContentElement);
            _viewportElement = _viewportElement || selectOrGenerateDivByClass(_classNameViewportElement);
            _paddingElement = _paddingElement || selectOrGenerateDivByClass(_classNamePaddingElement);

            if (_domExists) addClass(_hostElement, _classNameHostElementForeign);

            if (!_domExists) {
                addClass(_tE, _classNameHostElement);
                _hostElement.wrapInner(_contentElement)
                    .wrapInner(_viewportElement)
                    .wrapInner(_paddingElement);

                _contentElement = findFirst(_hostElement, '.' + _classNameContentElement);
                _viewportElement = findFirst(_hostElement, '.' + _classNameViewportElement);
                _paddingElement = findFirst(_hostElement, '.' + _classNamePaddingElement);
            }

            if (_isBody) addClass(_htmlElement, _classNameHTMLElement);

            _hostElementNative = _hostElement[0];
            _paddingElementNative = _paddingElement[0];
            _viewportElementNative = _viewportElement[0];
            _contentElementNative = _contentElement[0];

            updateViewportAttrsFromTarget();
        }

        function setupStructureEvents() {
            var scrollStopTimeoutId;
            var scrollStopDelay = 175;

            function contentOnTransitionEnd(event) {
                
                event = event.originalEvent || event;
                if (isSizeAffectingCSSProperty(event.propertyName)) _base.update('auto' );
            }
            function viewportOnScroll(event) {
                if (!_sleeping) {
                    if (scrollStopTimeoutId !== undefined)
                        clearTimeout(scrollStopTimeoutId);
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

            addDestroyEventListener(_contentElement, _strTransitionEndEvent, contentOnTransitionEnd);
            addDestroyEventListener(_viewportElement, _strScroll, viewportOnScroll, true);
        }


        //==== Scrollbars ====//
        function setupScrollbarsDOM(destroy) {
            var selectOrGenerateScrollbarDOM = function (isHorizontal) {
                var scrollbarClassName = isHorizontal ? _classNameScrollbarHorizontal : _classNameScrollbarVertical;
                var scrollbar = selectOrGenerateDivByClass(_classNameScrollbar + ' ' + scrollbarClassName, true);
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
                        removeClass(elm.removeAttr(COSYMBOL.s), _classNamesDynamicDestroy);
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
                    _paddingElement.after(_sVE);
                    _paddingElement.after(_sHE);
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
            var scrollDurationFactor = 1;
            var trackTimeout;
            var mouseDownScroll;
            var mouseDownOffset;
            var mouseDownInvertedScale;

            function getPointerPosition(event) {
                return _msieVersion && insideIFrame ? event['screen' + XY] : COMPAT.page(event)[xy]; //use screen coordinates in EDGE & IE because the page values are incorrect in frames.
            }
            function getPreparedScrollbarsOption(name) {
                return _currentPreparedOptions.scrollbars[name];
            }
            function stopClickEventPropagation(event) {
                COMPAT.stpP(event);
            }
            function onMouseTouchDownContinue(event) {
                var originalEvent = event.originalEvent || event;
                var isTouchEvent = originalEvent.touches !== undefined;
                return _sleeping || !_scrollbarsDragScrollingCache || (isTouchEvent && !getPreparedScrollbarsOption('touchSupport')) ? false : COMPAT.mBtn(event) === 1 || isTouchEvent;
            }
            function documentDragMove(event) {
                if (onMouseTouchDownContinue(event)) {
                    var trackLength = scrollbarVarsInfo._trackLength;
                    var handleLength = scrollbarVarsInfo._handleLength;
                    var scrollRange = scrollbarVarsInfo._maxScroll;
                    var scrollRaw = (getPointerPosition(event) - mouseDownOffset) * mouseDownInvertedScale;
                    var scrollDeltaPercent = scrollRaw / (trackLength - handleLength);
                    var scrollDelta = (scrollRange * scrollDeltaPercent);
                    scrollDelta = isFinite(scrollDelta) ? scrollDelta : 0;

                    _viewportElement[scroll](Math.round(mouseDownScroll + scrollDelta));

                    if (_scrollbarsHandlesDefineScrollPos)
                        refreshScrollbarHandleOffset(isHorizontal, mouseDownScroll + scrollDelta);

                    if (!_supportPassiveEvents)
                        COMPAT.prvD(event);
                }
                else
                    documentMouseTouchUp(event);
            }
            function documentMouseTouchUp(event) {
                event = event || event.originalEvent;

                setupResponsiveEventListener(_docE,
                    [_strMouseTouchMoveEvent, _strMouseTouchUpEvent, _strKeyDownEvent, _strKeyUpEvent, _strSelectStartEvent],
                    [documentDragMove, documentMouseTouchUp, documentOnSelectStart],
                    true);
                COMPAT.rAF()(function() {
                    setupResponsiveEventListener(_docE, 'click', stopClickEventPropagation, true, { _capture: true });
                });
                
                    
                if (_scrollbarsHandlesDefineScrollPos)
                    refreshScrollbarHandleOffset(isHorizontal, true);

                _scrollbarsHandlesDefineScrollPos = false;
                removeClass(_bodyElement, _classNameDragging);
                removeClass(scrollbarVars._handle, 'active');
                removeClass(scrollbarVars._track, 'active');
                removeClass(scrollbarVars._scrollbar, 'active');

                mouseDownScroll = undefined;
                mouseDownOffset = undefined;
                mouseDownInvertedScale = 1;

                if (trackTimeout !== undefined) {
                    _base.scrollStop();
                    clearTimeout(trackTimeout);
                    trackTimeout = undefined;
                }

                if (event) {
                    var rect = _hostElementNative[COSYMBOL.bCR]();
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

                mouseDownInvertedScale = getHostElementInvertedScale()[xy];
                mouseDownOffset = getPointerPosition(event);

                _scrollbarsHandlesDefineScrollPos = !getPreparedScrollbarsOption('snapHandle');
                addClass(_bodyElement, _classNameDragging);
                addClass(scrollbarVars._handle, 'active');
                addClass(scrollbarVars._scrollbar, 'active');

                setupResponsiveEventListener(_docE,
                    [_strMouseTouchMoveEvent, _strMouseTouchUpEvent, _strSelectStartEvent],
                    [documentDragMove, documentMouseTouchUp, documentOnSelectStart]);
                COMPAT.rAF()(function() {
                    setupResponsiveEventListener(_docE, 'click', stopClickEventPropagation, false, { _capture: true });
                });
                

                if (_msieVersion || !_documentMixed)
                    COMPAT.prvD(event);
                COMPAT.stpP(event);
            }
            function onTrackMouseTouchDown(event) {
                if (onMouseTouchDownContinue(event)) {
                    var handleToViewportRatio = scrollbarVars._info._handleLength / Math.round(Math.min(1, _viewportSize[scrollbarVars._w_h] / _contentScrollSizeCache[scrollbarVars._w_h]) * scrollbarVars._info._trackLength);
                    var scrollDistance = Math.round(_viewportSize[scrollbarVars._w_h] * handleToViewportRatio);
                    var scrollBaseDuration = 270 * handleToViewportRatio;
                    var scrollFirstIterationDelay = 400 * handleToViewportRatio;
                    var trackOffset = scrollbarVars._track.offset()[scrollbarVars._left_top];
                    var ctrlKey = event.ctrlKey;
                    var instantScroll = event.shiftKey;
                    var instantScrollTransition = instantScroll && ctrlKey;
                    var isFirstIteration = true;
                    var easing = 'linear';
                    var decreaseScroll;
                    var finishedCondition;
                    var scrollActionFinsished = function (transition) {
                        if (_scrollbarsHandlesDefineScrollPos) refreshScrollbarHandleOffset(isHorizontal, transition);
                    };
                    var scrollActionInstantFinished = function () {
                        scrollActionFinsished();
                        onHandleMouseTouchDownAction(event);
                    };
                    var scrollAction = function () {
                        var mouseOffset = (mouseDownOffset - trackOffset) * mouseDownInvertedScale;
                        var handleOffset = scrollbarVarsInfo._handleOffset;
                        var trackLength = scrollbarVarsInfo._trackLength;
                        var handleLength = scrollbarVarsInfo._handleLength;
                        var scrollRange = scrollbarVarsInfo._maxScroll;
                        var currScroll = scrollbarVarsInfo._currentScroll;
                        var scrollDuration = scrollBaseDuration * scrollDurationFactor;
                        var timeoutDelay = isFirstIteration ? Math.max(scrollFirstIterationDelay, scrollDuration) : scrollDuration;
                        var instantScrollPosition = scrollRange * ((mouseOffset - (handleLength / 2)) / (trackLength - handleLength)); // 100% * positionPercent
                        var decreaseScrollCondition = handleOffset > mouseOffset;
                        var scrollObj = {};
                        var animationObj = {
                            easing: easing,
                            step: function (now) {
                                if (_scrollbarsHandlesDefineScrollPos) {
                                    _viewportElement[scroll](now); //https://github.com/jquery/jquery/issues/4340
                                    refreshScrollbarHandleOffset(isHorizontal, now);
                                }
                            }
                        };
                        instantScrollPosition = isFinite(instantScrollPosition) ? instantScrollPosition : 0;

                        if (instantScroll) {
                            _viewportElement[scroll](instantScrollPosition); //scroll instantly to new position
                            if (instantScrollTransition) {
                                instantScrollPosition = _viewportElement[scroll]();
                                _viewportElement[scroll](currScroll);

                                scrollObj[xy] = instantScrollPosition;
                                _base.scroll(scrollObj, extendDeep(animationObj, {
                                    duration: 130,
                                    complete: scrollActionInstantFinished
                                }));
                            }
                            else
                                scrollActionInstantFinished();
                        }
                        else {
                            decreaseScroll = isFirstIteration ? decreaseScrollCondition : decreaseScroll;
                            finishedCondition = decreaseScroll ? handleOffset <= mouseOffset : handleOffset + handleLength >= mouseOffset;

                            if (finishedCondition) {
                                clearTimeout(trackTimeout);
                                _base.scrollStop();
                                trackTimeout = undefined;
                                scrollActionFinsished(true);
                            }
                            else {
                                trackTimeout = setTimeout(scrollAction, timeoutDelay);

                                scrollObj[xy] = (decreaseScroll ? '-=' : '+=') + scrollDistance;
                                _base.scroll(scrollObj, extendDeep(animationObj, {
                                    duration: scrollDuration
                                }));
                            }
                            isFirstIteration = false;
                        }
                    };
                    if (ctrlKey) increaseTrackScrollAmount();

                    mouseDownInvertedScale = getHostElementInvertedScale()[xy];
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

            addDestroyEventListener(scrollbarVars._handle,
                _strMouseTouchDownEvent,
                onHandleMouseTouchDown);
            addDestroyEventListener(scrollbarVars._track,
                [_strMouseTouchDownEvent, _strMouseEnter, _strMouseLeave],
                [onTrackMouseTouchDown, onTrackMouseTouchEnter, onTrackMouseTouchLeave]);
            addDestroyEventListener(scrollbarVars._scrollbar,
                _strMouseTouchDownEvent,
                onScrollbarMouseTouchDown);

            if (_supportTransition) {
                addDestroyEventListener(scrollbarVars._scrollbar, _strTransitionEndEvent, function (event) {
                    if (event.target !== scrollbarVars._scrollbar[0])
                        return;
                    refreshScrollbarHandleLength(isHorizontal);
                    refreshScrollbarHandleOffset(isHorizontal);
                });
            }
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
            var transitionDuration = 250;
            var scrollbarVars = getScrollbarVars(isHorizontal);
            var scrollbarVarsInfo = scrollbarVars._info;
            var strTranslateBrace = 'translate(';
            var strTransform = VENDOR._cssProperty('transform');
            var strTransition = VENDOR._cssProperty('transition');
            var nativeScroll = isHorizontal ? _viewportElement['scrollLeft']() : _viewportElement['scrollTop']();
            var currentScroll = scrollOrTransition === undefined || transition ? nativeScroll : scrollOrTransition;

            var handleLength = scrollbarVarsInfo._handleLength;
            var trackLength = scrollbarVars._track[0]['offset' + scrollbarVars._Width_Height];
            var handleTrackDiff = trackLength - handleLength;
            var handleCSS = {};
            var transformOffset;
            var translateValue;

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

            if (_supportTransform) {
                transformOffset = handleOffset; //in px
                translateValue = isHorizontal ? strTranslateBrace + transformOffset + 'px, 0)' : strTranslateBrace + '0, ' + transformOffset + 'px)';
                handleCSS[strTransform] = translateValue;

                if (_supportTransition) handleCSS[strTransition] = transition && Math.abs(handleOffset - scrollbarVarsInfo._handleOffset) > 1 ? getCSSTransitionString(scrollbarVars._handle) + ', ' + (strTransform + ' ' + transitionDuration + 'ms') : '';
            }
            else
                handleCSS[scrollbarVars._left_top] = handleOffset;

            scrollbarVars._handle.css(handleCSS);
            if (_supportTransform && _supportTransition && transition) {
                scrollbarVars._handle.one(_strTransitionEndEvent, function () {
                    scrollbarVars._handle.css(strTransition, '');
                });
            }

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

        function getCSSTransitionString(element) {
            var transitionStr = VENDOR._cssProperty('transition');
            var assembledValue = element.css(transitionStr);
            if (assembledValue)
                return assembledValue;
            var regExpString = '\\s*(' + '([^,(]+(\\(.+?\\))?)+' + ')[\\s,]*';
            var regExpMain = new RegExp(regExpString);
            var regExpValidate = new RegExp('^(' + regExpString + ')+$');
            var properties = 'property duration timing-function delay'.split(' ');
            var result = [];
            var strResult;
            var valueArray;
            var i = 0;
            var j;
            var splitCssStyleByComma = function (str) {
                strResult = [];
                if (!str.match(regExpValidate))
                    return str;
                while (str.match(regExpMain)) {
                    strResult.push(RegExp.$1);
                    str = str.replace(regExpMain, '');
                }

                return strResult;
            };
            for (; i < properties[COSYMBOL.l]; i++) {
                valueArray = splitCssStyleByComma(element.css(transitionStr + '-' + properties[i]));
                for (j = 0; j < valueArray[COSYMBOL.l]; j++)
                    result[j] = (result[j] ? result[j] + ' ' : '') + valueArray[j];
            }
            return result.join(', ');
        }

        function getHostElementInvertedScale() {
            var rect = _paddingElementNative[COSYMBOL.bCR]();
            return {
                x: _supportTransform ? 1 / (Math.round(rect.width) / _paddingElementNative[COSYMBOL.oW]) || 1 : 1,
                y: _supportTransform ? 1 / (Math.round(rect.height) / _paddingElementNative[COSYMBOL.oH]) || 1 : 1
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
                    if (OverlayScrollBarUtils.isPlainObject(classesOrAttrs)) {
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

            return (_domExists && !selectParent[COSYMBOL.l])
                ? null
                : _domExists
                    ? selectParent[onlyChildren ? 'children' : 'find']('.' + className.replace(/\s/g, '.')).eq(0)
                    : OverlayScrollBarUtils(generateDiv(className))
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
            if (force)
                return force;
            if (type(current) == 'object' && type(cache) == 'object') {
                for (var prop in current) {
                    if (prop !== 'c') {
                        if (current[COSYMBOL.hOP](prop) && cache[COSYMBOL.hOP](prop)) {
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
            return OverlayScrollBarUtils.extend.apply(this, [true].concat([].slice.call(arguments)));
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

        function construct(targetElement, options) {
            _defaultOptions = globals.defaultOptions;

            setOptions(extendDeep({}, _defaultOptions, options));
            _msieVersion = globals.msie;
            _autoUpdateRecommended = globals.autoUpdateRecommended;
            _supportTransition = globals.supportTransition;
            _supportTransform = globals.supportTransform;
            _supportPassiveEvents = globals.supportPassiveEvents;
            _docE = OverlayScrollBarUtils(targetElement.ownerDocument);
            _docENative = _docE[0];
            _wE = OverlayScrollBarUtils(_docENative.defaultView || _docENative.parentWindow);
            _wENative = _wE[0];
            _htmlElement = findFirst(_docE, 'html');
            _bodyElement = findFirst(_htmlElement, 'body');
            _tE = OverlayScrollBarUtils(targetElement);
            _isBody = _tE.is('body');
            _documentMixed = _docENative !== document;

            _domExists = _tE.hasClass(_classNameHostElement) && _tE.children('.' + _classNamePaddingElement)[COSYMBOL.l];

            var initBodyScroll;
            var bodyMouseTouchDownListener;

            if (_isBody) {
                initBodyScroll = {};
                initBodyScroll.l = Math.max(_tE['scrollLeft'](), _htmlElement['scrollLeft'](), _wE['scrollLeft']());
                initBodyScroll.t = Math.max(_tE['scrollTop'](), _htmlElement['scrollTop'](), _wE['scrollTop']());

                bodyMouseTouchDownListener = function () {
                    _viewportElement.removeAttr(COSYMBOL.ti);
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
                    _viewportElement.attr(COSYMBOL.ti, '-1');
                    _viewportElementNative.focus();

                    setupResponsiveEventListener(_viewportElement, _strMouseTouchDownEvent, bodyMouseTouchDownListener, false, true);
                }
            }
            _base.update('auto');
            _initialized = true;

            setTimeout(function () {
                if (_supportTransition) addClass(_hostElement, _classNameHostTransition);
            }, 333);

            return _base;
        }

        if (_plugin.valid(construct(pluginTargetElement, options))) {
            OverlayScrollBarInstances(pluginTargetElement, _base);
        }

        return _base;
    }
    
    _plugin = function (targetElements, options) {
        if (arguments[COSYMBOL.l] === 0) return this;
        var arr = [];
        var inst;
        options = options || {};
        var optsIsPlainObj = OverlayScrollBarUtils.isPlainObject(options);

        targetElements = targetElements[COSYMBOL.l] != undefined ? targetElements : [targetElements[0] || targetElements];
        initOverlayScrollbarsStatics();

        if (targetElements[COSYMBOL.l] > 0) {
            if (optsIsPlainObj) {
                OverlayScrollBarUtils.each(targetElements, function (i, v) {
                    inst = v;
                    if (inst !== undefined) arr.push(OverlayScrollbarsInstance(inst, options, _pluginsGlobals));
                });
            } else {
                OverlayScrollBarUtils.each(targetElements, function (i, v) {
                    inst = OverlayScrollBarInstances(v);
                    if ((options === '!' && _plugin.valid(inst)) || (COMPAT.type(options) == 'function' && options(v, inst))) arr.push(inst);
                    else if (options === undefined) arr.push(inst);
                });
            }
        }
    }

    _plugin.valid = function (osInstance) {
        return osInstance instanceof _plugin;// && !osInstance.getState().destroyed;
    };

    return _plugin;
})();

initOverlayScrollbars();
