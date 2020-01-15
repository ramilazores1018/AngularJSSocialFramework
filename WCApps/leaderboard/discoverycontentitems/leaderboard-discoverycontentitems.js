(function () {
  'use strict';

  reconnectApp
    .directive('wcDiscoveryContentItems', wcDiscoveryContentItems);

  function wcDiscoveryContentItems() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/socialtest/templates/leaderboard/discoverycontentitems/leaderboard-discoverycontentitems.html',
      scope: {
        catId: '@',
      },
      controller: wcDiscoveryContentItemsCtrl,
      controllerAs: 'dcitemsvm' 
    };

    function link(scope, elm, attrs) {

    }
    return directive;
  }
  wcDiscoveryContentItemsCtrl.$inject = ['$scope','$sce','wcDiscoveryContentItemsSvc','go'];

  function wcDiscoveryContentItemsCtrl($scope,$sce,wcDiscoveryContentItemsSvc,go) {
    var dcitemsvm = this;
    var hsUrl='';

    /**************
     *    METHODS
     ****************/

    /****************
     *  PROPERTIES
     ****************/

    function GetDiscoveryItems(catID){

      wcDiscoveryContentItemsSvc
      .getData(catID)
       .then(function (res) {
 
         dcitemsvm.discoveryHeaderListItems = res;

       });

    } 

    function init() {
      
      GetDiscoveryItems($scope.catId);

    }

    init();
  }
})();