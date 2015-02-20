/**
 * Flexible Carousel
 * @module Ink.UI.Carousel_1
 * @version 1
 */

Ink.createModule( 'Ink.UI.Slider', '1',
    [ 'Ink.UI.Common_1' , 'Ink.Dom.Event_1' , 'Ink.Dom.Selector_1' ],
    function(Common, Ivent, Css, Selector) {
    'use strict';

    var genId = function( ) {
        return 'cue_' + ( ~~( Math.random( ) * Math.pow( 32 , 6 ) ) ).toString( 32 );
    };

    var fixBoundingClientRect = function( bcr , prop ) {
        var val = bcr[ prop ];

        if ( isNaN( val ) ) {
            if ( prop === 'width'  ) { return bcr.right  - bcr.left + 1; }

            if ( prop === 'height' ) { return bcr.bottom - bcr.top  + 1; }
        }

        return val;
    };

    /**
     * @class Ink.UI.Slider_1
     * @constructor
     *
     * @param {String|Element}      selector                    DOM element or element id
     * @param {Object}              [options]                   Carousel Options
     * @param {Integer}             [options.autoAdvance]       Milliseconds to wait before auto-advancing pages. Set to 0 to disable auto-advance. Defaults to 0.
     * @param {String}              [options.axis]              Axis of the carousel. Set to 'y' for a vertical carousel. Defaults to 'x'.
     * @param {Number}              [options.initialPage]       Initial index page of the carousel. Defaults to 0.
     * @param {Boolean}             [options.spaceAfterLastSlide=true] If there are not enough slides to fill the full width of the last page, leave white space. Defaults to `true`.
     * @param {Boolean}             [options.swipe]             Enable swipe support if available. Defaults to true.
     * @param {Mixed}               [options.pagination]        Either an ul element to add pagination markup to or an `Ink.UI.Pagination` instance to use.
     * @param {Function}            [options.onChange]          Callback to be called when the page changes.
     *
     * @sample Ink_UI_Carousel_1.html
     */
    var Slider = function( ) {
        Common.BaseUIComponent.apply( this , arguments );
    };

    Slider._name = 'Slider_1';

    Slider._optionDefinition = {
        value            : [ 'Integer' , 0 ] ,
        min              : [ 'Integer' , 0 ] ,
        max              : [ 'Integer' , 1 ] ,
        offsetAttr       : [ 'String'  , 'left'  ] ,
        sizeAttr         : [ 'String'  , 'width' ] ,
        axis             : [ 'String'  , 'x' ] ,
        disableScrubbing : [ 'Boolean' , false ] ,
        skipDone         : [ 'Boolean' , false ] ,
        doneElement      : [ 'Element' , null ] ,
        handleElement    : [ 'Element' ] ,
        tickElement      : [ 'Element' , null ] ,
        onStart          : [ 'Function' , null ] ,
        onUpdateTick     : [ 'Function' , null ] ,
        onChanging       : [ 'Function' , null ] ,
        onChange         : [ 'Function' , null ]
    };

    Slider.prototype = {
        _init : function( ) {
            var s = this;

            var _o = s._options;

            s._v = _o.value;
            s._l = _o.max - _o.min;

            s._isDown = false;
            s._scrubbing = !_o.disableScrubbing;

            s._backedUpCues = { };
            s._currentCues  = { };

            s.setValue( s._v )
             ._updateBounds( );

            // touch events
            var ctn = s._element;

            var on = function(ev) {
                if ( !s._scrubbing ) { return; }

                var p = Ivent.pointer( ev );

                if ( ev.type === 'mousemove' || ev.type === 'touchmove' ) {
                    if ( _o.tickElement ) {
                        if( s._size  === 0 || s._size  === 1 ) { s._updateBounds( ); }

                        var v = s._getValueFromPointer( p , true );

                        if ( _o.onUpdateTick ) {
                            _o.onUpdateTick.call( s , p , v );
                        } else {
                            _o.tickElement.style[ _o.offsetAttr ] = ( v * 100 ).toFixed( 2 ) + '%';
                        }
                    }

                    if ( !s._isDown ) { return ; }
                }

                Ivent.stop( ev );

                if ( ev.type === 'mousedown' || ev.type === 'touchstart' ) {
                    if ( _o.onStart ) { _o.onStart.call( s ); }

                    s._updateBounds( )
                     ._isDown = true;
                }

                s.setValue( s._getValueFromPointer( p ) , true );

                if ( _o.onChanging ) {
                    _o.onChanging.call( s );
                }
            };

            var off = function(ev) {
                if ( !s._isDown || !s._scrubbing ) { return; }

                Ivent.stop( ev );

                s._isDown = false;

                if ( _o.onChange ) {
                    _o.onChange.call( s );
                }
            };

            var docEl = document.documentElement;
            Ivent.observe( ctn   , 'mousedown' , on  );
            Ivent.observe( docEl , 'mousemove' , on  );
            Ivent.observe( docEl , 'mouseup'   , off );

            Ivent.observe( ctn   , 'touchstart' , on  );
            Ivent.observe( docEl , 'touchmove'  , on  );
            Ivent.observe( docEl , 'touchend'   , off );

            return this;
        } ,

        changeLimits : function( min , max ) {
            this._options.min = min;
            this._options.max = max;

            this._l = max - min;

            this._updateBounds( );

            this.setValue( this._v );

            return this.backupCues(  'tmp' )
                       .removeCues(        )
                       .restoreCues( 'tmp' );
        } ,

        getValue : function( ) { return this._v; } ,

        setValue : function( v , force ) {
            if ( this._isDown && !force ) { return; }

            var _o = this._options;

            if      ( v < _o.min ) { v = _o.min; }
            else if ( v > _o.max ) { v = _o.max; }

            this._v = v;
            var pct = this._toPercent( v , true );

            if ( _o.doneElement && !_o.skipDone ) {
                _o.doneElement.style[ this._options.sizeAttr ] = pct;
            }

            _o.handleElement.style[ this._options.offsetAttr ] = pct;

            return this;
        },

        setScrubbing : function( v ) {
            Css.setClassName( this._element , 'disabled' , !v );

            this._scrubbing = !!v;

            return this;
        } ,

        // value, [id], [title], [color], [width]
        addCue : function( o ) {
            var id;

            if ( o.id ) {
                id = o.id;
            } else {
                o.id = id = genId( );
            }

            var cueEl = document.getElementById( id );

            if ( !cueEl ) {
                cueEl = document.createElement( 'div' );

                cueEl.className = 'cue';
                cueEl.id = id;
            }

            cueEl.style[ this._options.offsetAttr ] = this._toPercent( o.value , true );

            if ( o.title ) { cueEl.title = o.title; }

            if ( o.color ) { cueEl.style.backgroundColor = o.color; }

            if ( o.width ) { cueEl.style[ this._o.sizeAttr ] = o.width + 'px'; }

            this._element.insertBefore( cueEl , this._options.handleElement );

            this._currentCues[ id ] = o;

            return id;
        } ,

        removeCue : function( cueId ) {
            delete this._currentCues[ cueId ];

            var cueEl = document.getElementById( cueId );
            if ( !cueEl ) { return false; }

            this._element.removeChild( cueEl );

            return true;
        } ,

        removeCues : function( ) {
            for ( var cueId in this._currentCues ) {
                if ( !this._currentCues.hasOwnProperty( cueId ) ) { continue; }

                this.removeCue( cueId )
            }

            return this;
        } ,

        backupCues : function( storeName ) {
            this._backedUpCues[ storeName ] = this._currentCues;

            return this;
        } ,

        restoreCues : function( storeName ) {
            var t = this._backedUpCues[ storeName ];

            if ( !t ) {
                t = { };
                this._backedUpCues[ storeName ] = t;
            }

            this._currentCues = t;

            for ( var id in this._currentCues ) {
                if ( !this._currentCues.hasOwnProperty( id ) ) { continue; }

                this.addCue( this._currentCues[ id ] );
            }

            return this;
        } ,

        _updateBounds : function( ) {
            var bcr = this._element.getBoundingClientRect( );

            var tmpOff = fixBoundingClientRect( bcr , this._options.offsetAttr );
            var tmpSz  = fixBoundingClientRect( bcr , this._options.sizeAttr   );

            this._offset = tmpOff;
            this._size   = tmpSz;

            return this;
        } ,

        _toPercent : function( v , convertToRatioFirst ) {
            if ( convertToRatioFirst ) {
                v = this._toRatio( v );
            }

            if      ( v < 0 ) { v = 0; }
            else if ( v > 1 ) { v = 1; }

            return ( v * 100 ).toFixed( 2 ) + '%';
        } ,

        _toRatio : function( v ) {
            return ( v - this._options.min ) / this._l;
        } ,

        _getValueFromPointer : function( p , asRatio ) {
            var coord = p[ this._options.axis ] - this._offset;

            if ( this._options.offsetAttr === 'bottom' ) {
                coord *= -1;
            }

            var t = Math.max( 0 , Math.min( 1 , coord / this._size ) );

            return asRatio ? t :
                             this._options.min + t * this._l;
        }
    };


    Common.createUIComponent( Slider );

    return Slider;
});
