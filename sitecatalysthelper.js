/* encoding: utf-8

  ****  sitecatalystHelper provides a user-friendly configuration    ****
  ****  and ping API for the Omniture/SiteCatalyst counter service.  ****

  Copyright (c) 2010 Hugsmiðjan ehf. (http://www.hugsmidjan.is)
  written by:  Már Örlygsson (http://mar.anomy.net)

  Licensed under GPL 2.0 or above (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

-----------------------------------------------------------------------------

  Version:  1.0
  Requires:
    * jQuery 1.3+ 

-----------------------------------------------------------------------------

  Demo and Documentation:
    * <./sitecatalysthelper-commented-examples.html>
    * See also detailed comment blocks within this file

  Get updates from:
    * <http://github.com/maranomynet/sitecatalysthelper/>
    * <git://github.com/maranomynet/sitecatalysthelper.git>


*/

(function($, win, TRUE, FALSE){


  // ======================================================================
  //  Public API
  // ======================================================================
  var SCH = win.sitecatalystHelper = {


    // ======================================================================
    //  Public methods
    // ======================================================================


      // Set static/unoverridable defaults.
      // MUST be run once.
      // Can't be run multiple times.
      init: function(accountName, unoverridableProps, defaults){
          if (!_initHasRun)
          {
            _initHasRun = TRUE;
            _accountName = accountName || _accountName;
            $.extend(_unoverridableProps, unoverridableProps);
            $.extend(SCH.defaults, defaults);
            // attempt to make this method self-destruct - to avoid multiple runs.
            return;
          }
          ;;;win.console&&console.warn( ['Repeat run of sitecatalystHelper.init()'] );
        },


      // helper function to set/override individual (persistent) default config values
      setDefaults: function(defaults){
          $.extend(SCH.defaults, defaults);
        },

      // helper function to set/override tracking rules for (link/button) Elements or certain Element URLs
      track: function(selectors, urls){
          $.extend(SCH.trackSelectors, selectors);
          $.extend(SCH.trackUrls, urls);
        },


      // Accepts an Element (or a URL string), resolves what sort of tracking ping
      // should be performed (if any) and performs the ping.
      // Returns a boolean value indicating whether a ping was made.
      // Usage:
      //    sitecatalysHelper.resolvePing(DomElement);
      //    sitecatalysHelper.resolvePing(UrlString);
      //
      resolvePing: function (obj, extraConfig) {
          var config = _getTrackingConfig(obj);
          if ( config && extraConfig )
          {
            $.extend(config, extraConfig);
          }
          config.$onPing  &&  config.$onPing(obj);
          var doPing = config && !config.$notmethanks;
          if ( doPing )
          {
            SCH.ping(config);
          }
          return !!doPing;
        },


      // Performs a simple tracking ping using the supplied config,
      // either Micro (or Macro/pageload) depending on the second parameter.
      ping: function (config, doPageloadPing) {
          doPageloadPing = arguments.length>1 ? doPageloadPing : config && config.$pageloadPing;
          doPageloadPing ?
              SCH.pageloadPing(config):
              _ping(config)
        },


      // Performs a Macro ping using the supplied config.
      pageloadPing: function (config) {
          if ( _pageloadPropBuffer.length )
          {
            _pageloadPropBuffer.unshift({}, config);
            config = $.extend.apply($, _pageloadPropBuffer);
            _pageloadPropBuffer = []; // flush the buffer;
          }
          _ping(config, TRUE);
          _pageloadPingCount++;
        },


      // The `addPageloadProps` method (incrementally) adds values to a config object (buffer)
      // that gets used (flushed) when the next pageloadPing is triggered 
      // - which may be triggered manually, or automatically at window.onload
      // Useful for cases where (one or more) components within the page need/wish to set certain pageloadPing values.
      addPageloadProps: function (config) {
          _pageloadPropBuffer.push(config);
        },


      // reports how many pageloadPings have been performed yet.
      pageloadPingCount: function () {
          return _pageloadPingCount;
        },




    // ======================================================================
    //  Public properties (settings/etc.)
    // ======================================================================


      // list of CSS selectors and their associated click-tracking properties (used by the .ping() method)
      trackSelectors: {
      /*
        'css.selector': {
            // ..insert tracking config here...
          // Special values...
            $onPing:       function( elm ){ var config = this; },  // function to perform just-in-time modifications of config values when before ping is performed. 
            $priority:     0,       // accepts any positive or negative integer.  Higher priority config objects win over lower.
            $notmethanks:  false,   // set to true to disable the tracking for a matching link
            $pageloadPing: false,   // set to true for "macro-level" tracking (micro-level is default)
          },

      */
        },


      // list of link URLs and their associated click-tracking properties (used by the .ping() method)
      // accepts full URLs or relative URLs.
      trackUrls: {
      /*
          'http://www.foo.com/blah': {
              // see `.trackSelectors` above for info about available settins
            },
          '/smufoo.html?baz': {
              // see `.trackSelectors` above for info about available settins
            }
      */
        },


      defaults: {
          pageName:   '',
          server:     '',
          hier1:      '',
          channel:    '',
          pageType:   '',
          prop1:      '',
          prop2:      '',
          prop3:      '',
          prop4:      '',
          prop5:      '',
         // Conversion Variables...
          campaign:   '',
          state:      '',
          zip:        '',
          events:     '',
          products:   '',
          purchaseID: '',
          eVar1:      '',
          eVar2:      '',
          eVar3:      '',
          eVar4:      '',
          eVar5:      '',


        // == Default settings Copied from "ring-s-code-h20.3.js" because it looked like we might need it here too.
          charSet:               'UTF-8',
         // Conversion Config...
          currencyCode:          'ISK',
         // Link Tracking Config...
          trackDownloadLinks:    TRUE,
          trackExternalLinks:    TRUE,
          trackInlineStats:      TRUE,
          linkDownloadFileTypes: 'exe,zip,wav,mp3,mov,mpg,avi,wmv,doc,pdf,xls',
          linkInternalFilters:   'javascript:,.',
          linkLeaveQueryString:  FALSE,
          linkTrackVars:         'None',
          linkTrackEvents:       'None',


        // ******************** Plugin Section ********************************
          usePlugins:  TRUE,
          doPlugins:  function (s) {
              /* Add calls to plugins here */
              // if capaign doesn't have a value, get adreferral from the query string
              if(!s.campaign) { s.campaign=s.getValOnce(s.getQueryParam('adreferral'),'ring_ad_cookie'); }
              if(!s.eVar7) { s.eVar7=s.getValOnce(s.getQueryParam('iref'),'ring_iref_cookie'); }
            },

          // Plugin: getValOnce_v1.0
          getValOnce:  new Function("v","c","e",
              "var s=this,a=new Date,v=v?v:v='',c=c?c:c='s_gvo',e=e?e:0,k=s.c_r(c"+
              ");if(v){a.setTime(a.getTime()+e*86400000);s.c_w(c,v,e?a:0);}return"+
              " v==k?'':v"
            ),

          // Plugin: getQueryParam 2.3
          getQueryParam:  new Function("p","d","u",
              "var s=this,v='',i,t;d=d?d:'';u=u?u:(s.pageURL?s.pageURL:s.wd.locati"+
              "on);if(u=='f')u=s.gtfs().location;while(p){i=p.indexOf(',');i=i<0?p"+
              ".length:i;t=s.p_gpv(p.substring(0,i),u+'');if(t){t=t.indexOf('#')>-"+
              "1?t.substring(0,t.indexOf('#')):t;}if(t)v+=v?d+t:t;p=p.substring(i="+
              "=p.length?i:i+1)}return v"
            ),
          p_gpv:  new Function("k","u",
              "var s=this,v='',i=u.indexOf('?'),q;if(k&&i>-1){q=u.substring(i+1);v"+
              "=s.pt(q,'&','p_gvf',k)}return v"
            ),
          p_gvf:  new Function("t","k",
              "if(t){var s=this,i=t.indexOf('='),p=i<0?t:t.substring(0,i),v=i<0?'T"+
              "rue':t.substring(i+1);if(p.toLowerCase()==k.toLowerCase())return s."+
              "epa(v)}return ''"
            )

        }


    };






  // ======================================================================
  //  Private functions and properties
  // ======================================================================

      // Static/unoverridable settings
  var _accountName = '',
      _unoverridableProps = {
          visitorNamespace:     '',
          dc:                   '',
          trackingServer:       '',
          trackingServerSecure: ''
        },

      // Array container for config values set by portlets that should be merged and sent on next .pageloadPing()
      _pageloadPingCount  = 0,
      _pageloadPropBuffer = [],

      _initHasRun,


      // performs a macro/micro ping with the supplied config.
      _ping = function(config, doPageLoadPing){
          if (_initHasRun)
          {
            if (config)
            {
              // last-minute clean up of the config object before feeding it to the tracking functions.
              delete config.$onPing;
              delete config.$priority;
              delete config.$notmethanks;
              delete config.$pageloadPing;
            }

            config = $.extend({}, SCH.defaults, config, _unoverridableProps);
            for (var key in config)
            {
              var val = config[key];
              if (val.toLowerCase)
              {
                config[key] = val.toLowerCase();
              }
            }
            var s = $.extend(s_gi(_accountName), config);
            doPageLoadPing ?  
                s.tl():
                s.t();
            return;
          }
          ;;;win.console&&console.warn( 'You must run `sitecatalystHelper.init()` before pinging.' );
        },



      // Resolves and compiles the appropriate tracking config object for a link that is about to trigger a ping
      // Usage:
      //    _getTrackingConfig(DomElement);
      //    _getTrackingConfig(DomElement, UrlString);
      //    _getTrackingConfig(UrlString);
      //
      _getTrackingConfig = function (elm, url) {
          var configs = []; // an Array to hold all the settings objects that we might come across
          // iterate over the `trackSelectors` rule-sets and collect those that match `elm`
          if (typeof elm == 'string')
          {
            url = elm;
            elm = undefined;
          }
          if ( elm )
          {
            $.each(SCH.trackSelectors, function (selectorKey, cfg) {
                if ( elm.is(selectorKey) )
                {
                  cfg.$priority = cfg.$priority || 0;  // enforce priority for sort comparison below
                  configs.push(cfg);
                }
              });
            // sort the configs by (ascending) priority (highest $priority last), because of the way `jQuery.extend()` merges.
            configs.sort(function(a,b){ return a.$priority - b.$priority; });

            url = url || elm.attr('href');
          }

          // look up and append a `trackUrls` rule-set.
          if ( url )
          {
            var urls  = SCH.trackUrls,
                urlCfg = urls[ url ],
                url2,
                url3;
            if (!urlCfg)
            {
              // try again - this time stripping the protocol off the URL
              url2 = url.replace(/^https?:\/\//, '//');
              urlCfg = urls[ url2 ];
            }
            if (!urlCfg)
            {
              // try again - normalizing local URLs
              url3 = _normalizeLocalUrl(url);
              urlCfg = urls[ url3 ];
            }
            // try again one final time - this time removing # fragments off the URLs
            if ( !urlCfg && url.indexOf('#')>-1 )
            {
              urlCfg = urls[ url.split('#')[0] ]  ||
                       ( url2!=url  &&  urls[ url2.split('#')[0] ] )  ||
                       ( url3!=url  &&  urls[ url3.split('#')[0] ] );
            }
            //`.push()` because URL-based settings should have the highest priority.
            urlCfg  &&  configs.push(urlCfg);
          }
          if ( configs.length )  // because an "empty" configs Array always contains [true, {}].
          {
            // insert a "deep" boolean flag at the front, and the empty "target" object to extend;
            configs.unshift( TRUE, {} );
            // feed `configs` as an arguments list into jQuery.extend() to produce a nicely reduced union of "tracking configuration" settings.
            return $.extend.apply($, configs);
          }
        },


      // detects true "local" URLs and in those cases returns nice server-root relative URLs (with the protocol and hostname prefix chopped-off).
      // For a page with the URL "http://siminn.is:8080/", the following URLs are all considered "local"
      // and will return the following relative urls:
      //   * "https://ring.is:8080/foo"           -->  "/foo"
      //   * "http://ring.is:8080/index.html"     -->  "/index"
      //   * "//ring.is:8080/"                    -->  "/"
      //   * "https://www.ring.is:8080"           -->  "/"
      //   * "http://www.ring.is:8080/bar.jsp"    -->  "/bar.jsp"
      //   * "//www.ring.is:8080/baz/"            -->  "/baz/"
      _normalizeLocalUrl = function (url) {
          // Default to the current document URL - if no `url` is supplied.
          return (url||win.location.href).replace(_protocolPlusLocalDomain, '/');
        },


      // pattern that matches the local domain.
      _protocolPlusLocalDomain = new RegExp('^(https?:)?//(www\\.)?'+ win.location.host.replace(/\./g, '\\.') +'/?');



    // enforce at least one pageloadPing at window.onload.
    $(win).bind('load', function (e) {
        !_pageloadPingCount  &&  _initHasRun  &&  SCH.pageloadPing();
      });


})(jQuery, window, !0, !1);
