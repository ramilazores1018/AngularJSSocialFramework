(function () {
  'use strict';

  reconnectApp
    .directive('wcDiscoveryContent', wcDiscoveryContent);

  function wcDiscoveryContent() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/socialtest/templates/leaderboard/discoverycontent/leaderboard-discoverycontent.html',
      scope: {

      },
      controller: wcDiscoveryContentCtrl,
      controllerAs: 'disccategoryvm'
    };

    function link(scope, elm, attrs) {

    }
    return directive;
  }
  wcDiscoveryContentCtrl.$inject = ['$scope','$sce','wcDiscoveryContentSvc'];

  function wcDiscoveryContentCtrl($scope,$sce,wcDiscoveryContentSvc) {
    var disccategoryvm = this;
 
    /**************
     *    METHODS
     ****************/

    /****************
     *  PROPERTIES
     ****************/

    function init() {

      wcDiscoveryContentSvc
          .getData()
          .then(function (res) {
            disccategoryvm.discoveryHeaderList= res;
          });

    }


    init();
  }
})();