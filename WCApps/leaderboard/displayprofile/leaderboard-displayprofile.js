
(function () {
  'use strict';

  reconnectApp
    .directive('wcDisplayProfile', wcDisplayProfile);

  function wcDisplayProfile() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/socialtest/templates/leaderboard/displayprofile/leaderboard-displayprofile.html',
      scope: {

      },
      controller: wcDisplayProfileCtrl,
      controllerAs: 'displayprofilevm'
    };

    function link(scope, elm, attrs) {

    }
    return directive;
  }
  wcDisplayProfileCtrl.$inject = ['$scope','$sce','pplSvc'];

  function wcDisplayProfileCtrl($scope,$sce,pplSvc) {
    var displayprofilevm = this;
 
    /**************
     *    METHODS
     ****************/

    /****************
     *  PROPERTIES
     ****************/

    function init() {

      pplSvc.getUserById(_spPageContextInfo.userId, 'firstname')
      .then(function (res) {

        displayprofilevm.name = res.firstname;

       
      });
    }


    init();
  }
})();
