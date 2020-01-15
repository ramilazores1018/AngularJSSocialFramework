var reconnectApp = {
  userCanEdit: false
};

(function () {
  // Define module
  reconnectApp = angular.module('reconnect', [
    'lodashAngularWrapper',
    'angularjs-dropdown-multiselect',
    'feeds',
    'kendo.directives',
    'dndLists',
    'ngSanitize',
    'ngCsv',
    'ngMatters'
    // 'wcAlertCenter'
  ]);

  // After the AngularJS has been bootstrapped, you can no longer
  // use the normal module methods (ex, app.controller) to add
  // components to the dependency-injection container. Instead,
  // you have to use the relevant providers. Since those are only
  // available during the config() method at initialization time,
  // we have to keep a reference to them.
  
  reconnectApp.config(
["$controllerProvider", "$provide", "$compileProvider", "$filterProvider", "$locationProvider",   function ($controllerProvider, $provide, $compileProvider, $filterProvider, $locationProvider) {
      // $logProvider.debugEnabled(true);
      reconnectApp.controllerProvider = $controllerProvider;
      reconnectApp.provide = $provide;
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|iwl|tel):/); //Allow "iwl:" and "tel:" links
      reconnectApp.compileProvider = $compileProvider;
      reconnectApp.filterProvider = $filterProvider;
      reconnectApp.isWebkit = /webkit/.test(navigator.userAgent.toLowerCase()) || /chrome/.test(navigator.userAgent.toLowerCase());
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
      });
    }]
  );

  function appInit(common) {
    // timezone.appInitTimeZone($window, go);

    function initialize() {
      // $log.debug('_spPageContextInfo', _spPageContextInfo);
      if (localStorage) {
        var now = moment();
        var lastCleared = common.getCookie('localStorageCleared');
        if (common.isNullOrWhitespace(lastCleared) || (common.isDate(lastCleared) && now.diff(moment(lastCleared), 'minutes') > 60)) {
          //Mark cleared even if no action is necessary
          common.setCookie('localStorageCleared', now.format());
          //Clear only if > 500 items or > 4 MB of data (4,194,304 bytes)
          if (localStorage.length > 500 || unescape(encodeURIComponent(JSON.stringify(localStorage))).length > 4194304) {
            // $log.debug('cleared localStorage');
            localStorage.clear();
          }
        }
      }
    }

    //Ensure scripts are loaded
    SP.SOD.executeFunc('sp.runtime.js', null, function () {});
    SP.SOD.executeFunc('sp.js', null, function () {});

    ExecuteOrDelayUntilScriptLoaded(function () {
      ExecuteOrDelayUntilScriptLoaded(initialize, "sp.js");
    }, "sp.runtime.js");

  }

  reconnectApp.run(['common', appInit]);

  jQuery.cachedScript = function (url, options) {

    // Allow user to set any option except for dataType, cache, and url
    options = $.extend(options || {}, {
      dataType: "script",
      cache: true,
      url: url
    });

    // Use $.ajax() since it is more flexible than $.getScript
    // Return the jqXHR object so we can chain callbacks
    return jQuery.ajax(options);
  };

})();