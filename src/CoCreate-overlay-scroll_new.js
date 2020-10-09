var CoCreateOverlayScroll = (function() {
  var _base;

  var SCROLLBAR_WIDTH = getScrollbarWidth();
  var CLASSNAMES = {
    element: 'co_overlay-scroll',
    verticalScrollbar: 'co_scrollbar _vertical',
    horizontalScrollbar: 'co_scrollbar _horizontal',
    thumb: 'thumb',
    view: 'co_overlay-viewport',
    disable: 'co_scrollbar-disable-selection',
    prevented: 'co_prevented',
    resizeTrigger: 'co_resize-trigger',
  };

  function getScrollbarWidth() {
    var e = document.createElement('div'), sw;
    e.style.position = 'absolute';
    e.style.top = '-9999px';
    e.style.width = '100px';
    e.style.height = '100px';
    e.style.overflow = 'scroll';
    e.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(e);
    sw = (e.offsetWidth - e.clientWidth);
    document.body.removeChild(e);
    return sw;
  }

  function isSubstr (str, sub) {
    if(str.indexOf(sub) > -1) return true;
    return false;
  }

  function addClass(el, classNames) {
    if (el.classList) {
      return classNames.forEach(function(cl) {
        el.classList.add(cl);
      });
    }
    el.className += ' ' + classNames.join(' ');
  }

  function removeClass(el, classNames) {
    if (el.classList) {
      return classNames.forEach(function(cl) {
        el.classList.remove(cl);
      });
    }
    el.className = el.className.replace(new RegExp('(^|\\b)' + classNames.join('|') + '(\\b|$)', 'gi'), ' ');
  }

  function innerDomElement ( target, selector, isInnerWrap = false) {
    var innerEle = target.querySelector(selector);
    if(!innerEle) {
      innerEle = document.createElement('div');
      if(isInnerWrap){
        while(target.childNodes.length > 0) {
          innerEle.appendChild(target.childNodes[0]);
        }
      }
      target.appendChild(innerEle);
    }

    return innerEle;
  }

  function isIE() {
    var agent = navigator.userAgent.toLowerCase();
    return agent.indexOf("msie") !== -1 || agent.indexOf("trident") !== -1 || agent.indexOf(" edge/") !== -1;
  }

  function ScrollInstance(el) {
    var _instance = {
      element : el,
      options : {
        visible: 'show',
        hScroll: { behavior: 'scroll', pos: 'bottom' },
        vScroll: { behavior: 'scroll', pos: 'right' }
      },
      forceGemini : false,
      onResize : null,
      minThumbSize : 20,

      _cache : {events: {}},
      _cursorDown : false,
      _prevPageX : 0,
      _prevPageY : 0,

      _document : null,
      _viewElement : null,
      _scrollbarVerticalElement : null,
      _thumbVerticalElement : null,
      _scrollbarHorizontalElement : null,
      _scrollbarHorizontalElement : null
    }

    _instance.initDomOptions = function() {
      var scrollTypes = this.element.dataset.overlayScroll_type;
      if(typeof scrollTypes !== 'undefined'){
          scrollTypes = scrollTypes.toLowerCase();
          this.options.hScroll.behavior = isSubstr(scrollTypes, 'scrollx') ? "scroll" : "_disabled";
          this.options.vScroll.behavior = isSubstr(scrollTypes, 'scrolly') ? "scroll" : "_disabled";
      }

      var scrollPos = this.element.dataset.overlayScroll_pos;
      if(typeof scrollPos !== 'undefined'){
          scrollPos = scrollPos.toLowerCase();
          this.options.hScroll.pos = isSubstr(scrollPos, 'top') ? 'top' : 'bottom';
          this.options.vScroll.pos = isSubstr(scrollPos, 'left') ? 'left' : 'right';
      }

      var scrollVisible = this.element.dataset.overlayScroll_visible;
      var visibles = ['show', 'hide', 'auto'];
      if(typeof scrollVisible !== 'undefined'){
          scrollVisible = scrollVisible.toLowerCase();
          this.options.visible = visibles.indexOf(scrollVisible) > -1 ? scrollVisible : 'show';
      }

      console.log(this.options);
    }

    _instance.create = function() {
      this.initDomOptions();
      
      if ( !SCROLLBAR_WIDTH ) {
        addClass(this.element, [CLASSNAMES.prevented]);
  
        if (this.onResize) {
          this._viewElement = innerDomElement(this.element, ':scope > .' + CLASSNAMES.view, true);
          addClass(this._viewElement, [CLASSNAMES.view]);

          this._createResizeTrigger();
        }
      } else {
        var targetClassNames = []
        if(this.options.visible !== 'show') targetClassNames.push('scroll-' + this.options.visible);
        if(this.options.hScroll.behavior !== 'scroll') targetClassNames.push('horizontal' + this.options.hScroll.behavior);
        if(this.options.vScroll.behavior !== 'scroll') targetClassNames.push('vertical' + this.options.vScroll.behavior);
        addClass(this.element, targetClassNames);

        this._document = document;

        this._viewElement = innerDomElement(this.element, ':scope > .' + CLASSNAMES.view, true);
        addClass(this._viewElement, [CLASSNAMES.view]);

        this._scrollbarHorizontalElement = innerDomElement(this.element, ':scope > .' + CLASSNAMES.horizontalScrollbar.split(' ').join('.'));
        this._thumbHorizontalElement = innerDomElement(this._scrollbarHorizontalElement, ':scope > .' + CLASSNAMES.thumb);
        
        var hScrollClassNames = CLASSNAMES.horizontalScrollbar.split(/\s/);
        hScrollClassNames.push(this.options.hScroll.pos);
        
        addClass(this._scrollbarHorizontalElement, hScrollClassNames);
        addClass(this._thumbHorizontalElement, [CLASSNAMES.thumb]);

        this._scrollbarVerticalElement = innerDomElement(this.element, ':scope > .' + CLASSNAMES.verticalScrollbar.split(' ').join('.'));
        this._thumbVerticalElement = innerDomElement(this._scrollbarVerticalElement, ':scope > .' + CLASSNAMES.thumb);

        var vScrollClassNames = CLASSNAMES.verticalScrollbar.split(/\s/);
        vScrollClassNames.push(this.options.vScroll.pos);

        addClass(this._scrollbarVerticalElement, vScrollClassNames);
        addClass(this._thumbVerticalElement, [CLASSNAMES.thumb]);

        
      }
  
      this._createResizeTrigger();
      return this._bindEvents().update();
    };
  
    _instance._createResizeTrigger = function() {
      var obj = document.createElement('object');
      addClass(obj, [CLASSNAMES.resizeTrigger]);
      obj.type = 'text/html';
      obj.setAttribute('tabindex', '-1');
      var resizeHandler = this._resizeHandler.bind(this);
      obj.onload = function () {
        var win = obj.contentDocument.defaultView;
        win.addEventListener('resize', resizeHandler);
      };
  
      if (!isIE()) obj.data = 'about:blank';
  
      this.element.appendChild(obj);
  
      if (isIE()) obj.data = 'about:blank';
      this._resizeTriggerElement = obj;
    };
  
    _instance.update = function() {
      if (!SCROLLBAR_WIDTH) return this;
  
      this._viewElement.style.width = ((this.element.offsetWidth + SCROLLBAR_WIDTH).toString() + 'px');
      this._viewElement.style.height = ((this.element.offsetHeight + SCROLLBAR_WIDTH).toString() + 'px');
  
      this._naturalThumbSizeX = this._scrollbarHorizontalElement.clientWidth / this._viewElement.scrollWidth * this._scrollbarHorizontalElement.clientWidth;
      this._naturalThumbSizeY = this._scrollbarVerticalElement.clientHeight / this._viewElement.scrollHeight * this._scrollbarVerticalElement.clientHeight;
  
      this._scrollTopMax = this._viewElement.scrollHeight - this._viewElement.clientHeight;
      this._scrollLeftMax = this._viewElement.scrollWidth - this._viewElement.clientWidth;

      if (this._naturalThumbSizeY < this.minThumbSize) {
        this._thumbVerticalElement.style.height = this.minThumbSize + 'px';
      } else if (this._scrollTopMax) {
        this._thumbVerticalElement.style.height = this._naturalThumbSizeY + 'px';
      } else {
        this._thumbVerticalElement.style.height = '0px';
      }
  
      if (this._naturalThumbSizeX < this.minThumbSize) {
        this._thumbHorizontalElement.style.width = this.minThumbSize + 'px';
      } else if (this._scrollLeftMax) {
        this._thumbHorizontalElement.style.width = this._naturalThumbSizeX + 'px';
      } else {
        this._thumbHorizontalElement.style.width = '0px';
      }
  
      this._thumbSizeY = this._thumbVerticalElement.clientHeight;
      this._thumbSizeX = this._thumbHorizontalElement.clientWidth;
  
      this._trackTopMax = this._scrollbarVerticalElement.clientHeight - this._thumbSizeY;
      this._trackLeftMax = this._scrollbarHorizontalElement.clientWidth - this._thumbSizeX;
  
      this._scrollHandler();
  
      return this;
    };
  
    _instance.destroy = function() {
      if (this._resizeTriggerElement) {
        this.element.removeChild(this._resizeTriggerElement);
        this._resizeTriggerElement = null;
      }
  
      if (!SCROLLBAR_WIDTH) return this;
  
      this._unbinEvents();
  
      removeClass(this.element, [CLASSNAMES.element, 'scroll-' + this.options.visible]);
  
      this.element.removeChild(this._scrollbarVerticalElement);
      this.element.removeChild(this._scrollbarHorizontalElement);
      while(this._viewElement.childNodes.length > 0) {
        this.element.appendChild(this._viewElement.childNodes[0]);
      }
      this.element.removeChild(this._viewElement);
  
      this._document = null;
  
      return null;
    };
  
    _instance._bindEvents = function() {
      this._cache.events.scrollHandler = this._scrollHandler.bind(this);
      this._cache.events.clickVerticalTrackHandler = this._clickVerticalTrackHandler.bind(this);
      this._cache.events.clickHorizontalTrackHandler = this._clickHorizontalTrackHandler.bind(this);
      this._cache.events.clickVerticalThumbHandler = this._clickVerticalThumbHandler.bind(this);
      this._cache.events.clickHorizontalThumbHandler = this._clickHorizontalThumbHandler.bind(this);
      this._cache.events.mouseUpDocumentHandler = this._mouseUpDocumentHandler.bind(this);
      this._cache.events.mouseMoveDocumentHandler = this._mouseMoveDocumentHandler.bind(this);
  
      this._viewElement.addEventListener('scroll', this._cache.events.scrollHandler);
      this._scrollbarVerticalElement.addEventListener('mousedown', this._cache.events.clickVerticalTrackHandler);
      this._scrollbarHorizontalElement.addEventListener('mousedown', this._cache.events.clickHorizontalTrackHandler);
      this._thumbVerticalElement.addEventListener('mousedown', this._cache.events.clickVerticalThumbHandler);
      this._thumbHorizontalElement.addEventListener('mousedown', this._cache.events.clickHorizontalThumbHandler);
      this._document.addEventListener('mouseup', this._cache.events.mouseUpDocumentHandler);
  
      return this;
    };
  
    _instance._unbinEvents = function() {
      this._viewElement.removeEventListener('scroll', this._cache.events.scrollHandler);
      this._scrollbarVerticalElement.removeEventListener('mousedown', this._cache.events.clickVerticalTrackHandler);
      this._scrollbarHorizontalElement.removeEventListener('mousedown', this._cache.events.clickHorizontalTrackHandler);
      this._thumbVerticalElement.removeEventListener('mousedown', this._cache.events.clickVerticalThumbHandler);
      this._thumbHorizontalElement.removeEventListener('mousedown', this._cache.events.clickHorizontalThumbHandler);
      this._document.removeEventListener('mouseup', this._cache.events.mouseUpDocumentHandler);
      this._document.removeEventListener('mousemove', this._cache.events.mouseMoveDocumentHandler);
  
      return this;
    };
  
    _instance._scrollHandler = function() {
      var x = (this._viewElement.scrollLeft * this._trackLeftMax / this._scrollLeftMax) || 0;
      var y = (this._viewElement.scrollTop * this._trackTopMax / this._scrollTopMax) || 0;

      this._thumbHorizontalElement.style.msTransform = 'translateX(' + x + 'px)';
      this._thumbHorizontalElement.style.webkitTransform = 'translate3d(' + x + 'px, 0, 0)';
      this._thumbHorizontalElement.style.transform = 'translate3d(' + x + 'px, 0, 0)';
      
      if(this.options.vScroll.behavior == 'scroll'){
        this._thumbVerticalElement.style.msTransform = 'translateY(' + y + 'px)';
        this._thumbVerticalElement.style.webkitTransform = 'translate3d(0, ' + y + 'px, 0)';
        this._thumbVerticalElement.style.transform = 'translate3d(0, ' + y + 'px, 0)';
      }
    };
  
    _instance._resizeHandler = function() {
      this.update();
      if (this.onResize) {
        this.onResize();
      }
    };
  
    _instance._clickVerticalTrackHandler = function(e) {
      if(e.target !== e.currentTarget) {
        return;
      }
      var offset = e.offsetY - this._naturalThumbSizeY * .5
        , thumbPositionPercentage = offset * 100 / this._scrollbarVerticalElement.clientHeight;
  
      this._viewElement.scrollTop = thumbPositionPercentage * this._viewElement.scrollHeight / 100;
    };
  
    _instance._clickHorizontalTrackHandler = function(e) {
      if(e.target !== e.currentTarget) {
        return;
      }
      var offset = e.offsetX - this._naturalThumbSizeX * .5
        , thumbPositionPercentage = offset * 100 / this._scrollbarHorizontalElement.clientWidth;
  
      this._viewElement.scrollLeft = thumbPositionPercentage * this._viewElement.scrollWidth / 100;
    };
  
    _instance._clickVerticalThumbHandler = function(e) {
      this._startDrag(e);
      this._prevPageY = this._thumbSizeY - e.offsetY;
    };
  
    _instance._clickHorizontalThumbHandler = function(e) {
      this._startDrag(e);
      this._prevPageX = this._thumbSizeX - e.offsetX;
    };
  
    _instance._startDrag = function(e) {
      this._cursorDown = true;
      addClass(document.body, [CLASSNAMES.disable]);
      this._document.addEventListener('mousemove', this._cache.events.mouseMoveDocumentHandler);
      this._document.onselectstart = function() {return false;};
    };
  
    _instance._mouseUpDocumentHandler = function() {
      this._cursorDown = false;
      this._prevPageX = this._prevPageY = 0;
      removeClass(document.body, [CLASSNAMES.disable]);
      this._document.removeEventListener('mousemove', this._cache.events.mouseMoveDocumentHandler);
      this._document.onselectstart = null;
    };
  
    _instance._mouseMoveDocumentHandler = function(e) {
      if (this._cursorDown === false) {return;}
  
      var offset, thumbClickPosition;
  
      if (this._prevPageY) {
        offset = e.clientY - this._scrollbarVerticalElement.getBoundingClientRect().top;
        thumbClickPosition = this._thumbSizeY - this._prevPageY;
  
        this._viewElement.scrollTop = this._scrollTopMax * (offset - thumbClickPosition) / this._trackTopMax;
  
        return void 0;
      }
  
      if (this._prevPageX) {
        offset = e.clientX - this._scrollbarHorizontalElement.getBoundingClientRect().left;
        thumbClickPosition = this._thumbSizeX - this._prevPageX;
  
        this._viewElement.scrollLeft = this._scrollLeftMax * (offset - thumbClickPosition) / this._trackLeftMax;
      }
    };
    
    _instance.create();
    return _instance;
  }

  _base = {
    
    _objects: [],

    init: function() {
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
        this._objects.push(new ScrollInstance(el));
    }
  };

  return _base;
})();

window.onload = function(){
  CoCreateOverlayScroll.init();
}
