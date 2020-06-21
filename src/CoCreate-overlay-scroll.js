let overlayScrollDefaultSettings = {
    maxScrollbarLength: null,
    minScrollbarLength: null,
    scrollingThreshold: 1000,
    scrollXMarginOffset: 0,
    scrollYMarginOffset: 0,
    isRtl: false,
}

let _env = {
    isWebKit: typeof document !== 'undefined' &&
        'WebkitAppearance' in document.documentElement.style,
    supportsTouch: typeof window !== 'undefined' && 
        ('ontouchstart' in window || 
            ('maxTouchPoints' in window.navigator && window.navigator.maxTouchPoints > 0) || 
            (window.DocumentTouch && document instanceof window.DocumentTouch))
}

initOverlayScrollbars();

function initOverlayScrollbars(){
    var overlayScrollers = document.querySelectorAll('.overlay-scroll');
    
    for(let el of overlayScrollers){
        if(checkOverlayScrollType(el, 'x')){
            var OverlayScrollXBar = overlayScrollTrack(el, 'x');
            initOverlayMouseDragHandler(el, OverlayScrollXBar, 'x');
        }
            
        if(checkOverlayScrollType(el, 'y')){
            var OverlayScrollYBar = overlayScrollTrack(el, 'y');
            initOverlayMouseDragHandler(el, OverlayScrollYBar, 'y');
        }

        initOverlayMouseScrollHandler(el);
        // initOverlayScrollTouch(el);        
    }
}

function initOverlayMouseScrollHandler(el){
    
    function shouldbePreventDefault(el, deltaX, deltaY){
        var roundedScrollTop = Math.floor(el.scrollTop);
        var isTop = el.scrollTop === 0;
        var isBottom = roundedScrollTop + el.offsetHeight === el.scrollHeight;
        var isLeft = el.scrollLeft === 0;
        var isRight = el.scrollLeft + el.offsetWidth === el.scrollWidth;
        
        var hitsBound;
        if(Math.abs(deltaY) > Math.abs(deltaX))
            hitsBound = isTop || isBottom;
        else
            hitsBound = isLeft || isRight;

        return hitsBound ? !getSettings(el, 'overlayScroll_propagation') : true;
    }

    function shouldBeConsumeByChild(target, deltaX, deltaY){
        var cursor = target;
        var maxScrollTop = cursor.scrollHeight - cursor.clientHeight;
        
        return false;
    }

    function getDeltaFromEvent(e){
        
        var deltaX = e.deltaX;
        var deltaY = -1 * e.deltaY;
    
        if (typeof deltaX === 'undefined' || typeof deltaY === 'undefined') {
            deltaX = (-1 * e.wheelDeltaX) / 6;
            deltaY = e.wheelDeltaY / 6;
        }
    
        if (e.deltaMode && e.deltaMode === 1) {
            deltaX *= 10;
            deltaY *= 10;
        }
    
        if (deltaX !== deltaX && deltaY !== deltaY) {
            deltaX = 0;
            deltaY = e.wheelDelta;
        }
    
        if (e.shiftKey)
            return [-deltaY, -deltaX];
        
        return [deltaX, deltaY];
    }
    
    function mousewheelHandler(e){
        var ref = getDeltaFromEvent(e);
        var deltaX = ref[0];
        var deltaY = ref[1];
        
        if(shouldBeConsumeByChild(e.target, deltaX, deltaY)){
            return;
        }
        
        /// need to check child's scroll
        var _container = getContainer(this);
        var wheelSpeed = getSettings(this, 'overlayScroll_speed');

        var shouldPrevent = false;
        var isScrollX = checkOverlayScrollType(_container, 'x');
        var isScrollY = checkOverlayScrollType(_container, 'y');
        if(isScrollX && isScrollY){
            _container.scrollTop -= deltaY * wheelSpeed;
            _container.scrollLeft += deltaX * wheelSpeed;
        }else if(isScrollX && !isScrollY){
            if(deltaX)
                _container.scrollLeft += deltaX * wheelSpeed;        
            else{
                _container.scrollLeft -= deltaY * wheelSpeed;
                shouldPrevent = true;
            }
        }else if(!isScrollX && isScrollY){
            if(deltaY)
                _container.scrollTop -= deltaY * wheelSpeed;
            else{
                _container.scrollTop += deltaX * wheelSpeed;
                shouldPrevent = true;
            }
        }
        
        updateScrollGeometry(this);
        
        shouldPrevent = shouldPrevent || shouldbePreventDefault(_container, deltaX, deltaY);
        if(shouldPrevent && !e.ctrlKey){
            e.stopPropagation();
            if(e.defaultPrevented) e.preventDefault();    
        }
    }

    if(typeof window.onwhell !== 'undefined'){
        el.addEventListener('wheel', mousewheelHandler);
    }else if(typeof window.onmousewheel !== 'undefined'){
        el.addEventListener('mousewheel', mousewheelHandler);
    }
}
function initOverlayMouseDragHandler(el, scrollBar, direction){
    var _container = getContainer(el);
    
    if(direction == 'x'){
        var _containerHeight = 'containerWidth';
        var _contentHeight = 'contentWidth';
        var _page = 'pageX';
        var _scrollTop = 'scrollLeft';
        var _ref = 'width';
    }else{
        var _containerHeight = 'containerHeight';
        var _contentHeight = 'contentHeight';
        var _page = 'pageY';
        var _scrollTop = 'scrollTop';
        var _ref = 'height';
    }
    
    let ownerDocument = getOwnerDocument(el);
    let scrollThumb = overlayScrollThumb(scrollBar, direction);
    var startingScrollTop = null;
    var startingMousePageY = null;
    var scrollBy = null;
    
    function overlayMouseMoveHandler(e){
        if(e.touches && e.touches[0]){
            e[_page] = e.touches[0].pageY;
        }
        
        _container[_scrollTop] = startingScrollTop + scrollBy*(e[_page] - startingMousePageY);
        
        addScrollingClass(el, direction);
        updateScrollGeometry(el);
        
        e.stopPropagation();
        e.preventDefault();
    }
    function overlayMouseUpHandler(){
        removeScrollingClass(el, direction);
        scrollBar.classList.remove('overlay-scroll--clicking-track');
        ownerDocument.removeEventListener('mousemove', overlayMouseMoveHandler);
    }
    function bindOverlayMoves(e, touchMode){
        var containerGeometry = getContainerGeometry(el);
        var containerGeo = containerGeometry[_containerHeight];
        var contentGeo = containerGeometry[_contentHeight];
        var trackGeo = parseInt(scrollBar.style[_ref], 10);
        var scrollbarGeo = parseInt(scrollThumb.style[_ref], 10);

        startingScrollTop = _container[_scrollTop];
        if(touchMode && e.touches){
            e[_page] = e.touches[0].pageY;
        }
        startingMousePageY = e[_page];
        scrollBy = (contentGeo - containerGeo)/(trackGeo - scrollbarGeo);
        
        if(!touchMode){
            ownerDocument.addEventListener('mousemove', overlayMouseMoveHandler);
            ownerDocument.addEventListener('mouseup', overlayMouseUpHandler, {once:true});
        }else{
            ownerDocument.addEventListener('touchmove', overlayMouseMoveHandler());
        }
        
        scrollBar.classList.add('overlay-scroll--clicking-track');
        e.stopPropagation();
    }

    scrollThumb.addEventListener('mousedown', function(e){ bindOverlayMoves(e)});
    scrollThumb.addEventListener('touchstart', function(e){ bindOverlayMoves(e, true)});
    
    scrollBar.addEventListener('mousedown', function(e){
        
        var containerGeometry = getContainerGeometry(el);
        
        if(direction == 'x'){
            var positionLeft = e.pageX - window.pageXOffset - this.getBoundingClientRect().left;
            var _dir = positionLeft > parseInt(scrollThumb.style.left, 10) ? 1: -1;
            _container.scrollLeft += _dir * containerGeometry.containerWidth;
        }else{
            var positionTop = e.pageY - window.pageYOffset - this.getBoundingClientRect().top;
            var _dir = positionTop > parseInt(scrollThumb.style.top, 10) ? 1: -1;
            _container.scrollTop += _dir * containerGeometry.containerHeight;
        }
        
        updateScrollGeometry(el);
        e.stopPropagation(); 
    });
}

function updateScrollGeometry(ele){
    var _data = {};
    let _container = getContainer(ele);

    _data['roundedScrollTop'] = Math.floor(_container.scrollTop);
    _data['roundedScrollLeft'] = Math.floor(_container.scrollLeft);

    var containerGeometry = getContainerGeometry(ele);
    var containerWidth = containerGeometry.containerWidth;
    var containerHeight = containerGeometry.containerHeight;
    var contentWidth = containerGeometry.contentWidth;
    var contentHeight = containerGeometry.contentHeight;

    var isScrollXType = checkOverlayScrollType(ele, 'x');
    var scrollbarXActive = false;
    if(isScrollXType && containerWidth + overlayScrollDefaultSettings.scrollXMarginOffset < contentWidth){
        scrollbarXActive = true;
        _data['scrollXTrack'] = overlayScrollTrack(ele, 'x');
        _data['trackXWidth'] = containerWidth - getBorderWidth(ele, 'x');
        _data['scrollbarXWidth'] = getThumbSize(toInt((_data.trackXWidth * containerWidth)/contentWidth));
        _data['scrollbarXLeft'] = toInt(_data.roundedScrollLeft * (_data.trackXWidth - _data.scrollbarXWidth)/(contentWidth - containerWidth));
    }
    
    var isScrollYType = checkOverlayScrollType(ele, 'y');
    var scrollbarYActive = false;
    if(isScrollYType && containerHeight + overlayScrollDefaultSettings.scrollYMarginOffset < contentHeight){
        scrollbarYActive = true;
        _data['scrollYTrack'] = overlayScrollTrack(ele, 'y');
        _data['trackYHeight'] = containerHeight - getBorderWidth(ele, 'y');
        _data['scrollbarYHeight'] = getThumbSize(toInt((_data.trackYHeight * containerHeight)/contentHeight));
        _data['scrollbarYTop'] = toInt(_data.roundedScrollTop * (_data.trackYHeight - _data.scrollbarYHeight)/(contentHeight - containerHeight));
    }
    
    if (_data.scrollbarXLeft >= _data.trackXWidth - _data.scrollbarXWidth) {
      _data.scrollbarXLeft = _data.trackXWidth - _data.scrollbarXWidth;
    }
    if (_data.scrollbarYTop >= _data.trackYHeight - _data.scrollbarYHeight) {
      _data.scrollbarYTop = _data.trackYHeight - _data.scrollbarYHeight;
    }
    
    updateOverlayScrollCss(ele, _container, _data);

    if (scrollbarXActive) {
      ele.classList.add('overlay-scroll--active-x');
    } else {
      ele.classList.remove('overlay-scroll--active-x');
      ele.scrollLeft = overlayScrollDefaultSettings.isRtl === true ? contentWidth : 0;
    }
    if (scrollbarYActive) {
      ele.classList.add('overlay-scroll--active-y');
    } else {
      ele.classList.remove('overlay-scroll--active-y');
      ele.scrollTop = 0;
    }
}
function updateOverlayScrollCss(ele, _container, _data){
    if(typeof _data.scrollXTrack !== 'undefined'){
        var scrollBarX = overlayScrollThumb(_data.scrollXTrack, 'x');

        var xRailOffset = { width: _data.trackXWidth };
        if(overlayScrollDefaultSettings.isRtl){
            xRailOffset.left = _container.scrollLeft; // uncompleted code
        }else{
            xRailOffset.left = _container.scrollLeft;    
        }
        
        if(checkOverlayScrollPosition(ele, 'x') == 'top')
            xRailOffset.top = _data.roundedScrollTop;    
        else
            xRailOffset.bottom = -_data.roundedScrollTop;

        set(_data.scrollXTrack, xRailOffset);
        set(scrollBarX, { left: _data.scrollbarXLeft, width: _data.scrollbarXWidth - getBorderWidth(_data.scrollXTrack, 'x')});
    }
    
    
    if(typeof _data.scrollYTrack !== 'undefined'){
        var scrollBarY = overlayScrollThumb(_data.scrollYTrack, 'y');
        
        var yRailOffset = { top: _data.roundedScrollTop, height: _data.trackYHeight };
        
        // uncompleted code
        // if(overlayScrollDefaultSettings.isRtl){
        // }else{
        // }
        
        if(checkOverlayScrollPosition(ele, 'y') == 'left')
            yRailOffset.left = _container.scrollLeft;                
        else
            yRailOffset.right = -_container.scrollLeft;

        set(_data.scrollYTrack, yRailOffset);
        set(scrollBarY, { top: _data.scrollbarYTop, height: _data.scrollbarYHeight - getBorderWidth(_data.scrollYTrack, 'y')});
    }
}

function addScrollingClass(el, dir){
    var classList = el.classList;
    var className = 'overlay-scroll--scrolling-' + dir;
    if(!classList.contains(className)){
        classList.add(className);
    }
}
function removeScrollingClass(el, dir){
    el.classList.remove('overlay-scroll--scrolling-' + dir);
}

function getOwnerDocument(el){
    return el.ownerDocument || document;
}
function getContainer(el){
    if(el.tagName !== 'BODY') return el;
    return document.documentElement;
}
function getContainerGeometry(el){
    var rect = el.getBoundingClientRect();
    
    var containerWidth = Math.ceil(rect.width);
    var containerHeight = Math.ceil(rect.height);
    var contentWidth = el.scrollWidth;
    var contentHeight = el.scrollHeight;
    return {
        'containerWidth': containerWidth,
        'containerHeight': containerHeight,
        'contentWidth': contentWidth,
        'contentHeight': contentHeight
    };
}
function getThumbSize(thumbSize){
    if(overlayScrollDefaultSettings.minScrollbarLength){
        thumbSize = Math.max(thumbSize, overlayScrollDefaultSettings.minScrollbarLength);
    }
    if(overlayScrollDefaultSettings.maxScrollbarLength){
        thumbSize = Math.min(thumbSize, overlayScrollDefaultSettings.maxScrollbarLength);
    }
    return thumbSize;
}
function getBorderWidth(el, dir){
    var _styles = getComputedStyle(el);
    if(dir == 'x'){
        return toInt(_styles.borderLeftWidth) + toInt(_styles.borderRightWidth);
    }else{
        return toInt(_styles.borderTopWidth) + toInt(_styles.borderBottomWidth);
    }
}
function getSettings(el, name){
    var data = el.dataset[name];

    switch (name) {
        case 'overlayScroll_speed':
            data = Number(data);
            data = data ? data : 1;
            break;
        case 'overlayScroll_propagation':
            data = typeof data == 'undefined' ? 'true' : data;
            data = data == 'true' ? true : false;
            break;
        case 'overlayScroll_min':
            data = Number(data);
            data = data && data > 10 ? data : 10;
            break;
        case 'overlayScroll_max':
            data = Number(data);
            data = data && data > 10 ? data : null;
            break;
        default:
            break;
    }
    
    return data;
}
function div(className){
    var div = document.createElement('div');
    div.classList.add(className);
    return div;
}
function set(element, obj) {
    for (var key in obj) {
      var val = obj[key];
      if (typeof val === 'number') {
        val = val + "px";
      }
      element.style[key] = val;
    }
    return element;
 }
function toInt(val){
    return parseInt(val, 10) || 0;
}

function checkOverlayScrollType(ele, dir){
    var scrollTypes = ele.dataset.overlayScroll_type;
    if(typeof scrollTypes !== 'undefined'){
        if(scrollTypes.toLowerCase().includes('scroll' + dir)) return true;
        else return false;
    } else return true;
}
function checkOverlayScrollPosition(ele, dir){
    var scrollPositions = ele.dataset.overlayScroll_position;
    if(dir == 'x'){
        if(typeof scrollPositions !== 'undefined' && scrollPositions.toLowerCase().includes('top'))
            return 'top';
        else return 'bottom';
    }
    
    if(dir == 'y'){
        if(typeof scrollPositions !== 'undefined' && scrollPositions.toLowerCase().includes('left'))
            return 'left';
        else return 'right';
    }
}

function instantiateOverlayScrollBar(dir){
    let track = div('overlay-scroll__track-' + dir);
    let thumb = div('overlay-scroll__thumb-' + dir);
    track.appendChild(thumb);
    thumb.setAttribute('tabindex', 0);
    
    // thumb.addEventListener('focus', overlayScrollFocus);
    // thumb.addEventListener('blur', overlayScrollBlur);
    
    return track;
}
function overlayScrollTrack(el, dir){
    var _scrollbar = Array.prototype.filter.call(el.children, function(child){ return child.classList.contains('overlay-scroll__track-' + dir)})[0];

    if(typeof _scrollbar === 'undefined') {
        _scrollbar = instantiateOverlayScrollBar(dir);
        el.appendChild(_scrollbar);
    }
    return _scrollbar;
}
function overlayScrollThumb(el, dir){
    return el.getElementsByClassName('overlay-scroll__thumb-' + dir)[0];
}


// function overlayScrollFocus(){
//     console.log('Overlay Scrollbar is Focussed');
// }
// function overlayScrollBlur(){
//     console.log('Overlay Scrollbar is Blurred');
// }
// function initOverlayScrollTouch(ele){
//     if(!_env.supportsTouch) return;
//     ele.addEventListener('touchstart', overlayScrollTouchStart);
//     ele.addEventListener('touchmove', overlayScrollTouchMove);
//     ele.addEventListener('touchend', overlayScrollTouchEnd);
// }
// function overlayScrollTouchStart(e){
//     console.log('touch starting', e);
// }
// function overlayScrollTouchMove(e){
//     console.log('touch moving', e);
// }
// function overlayScrollTouchEnd(e){
//     console.log('touch ended', e);
// }