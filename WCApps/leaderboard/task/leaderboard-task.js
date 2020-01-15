(function () {
  'use strict';

  reconnectApp
    .directive('wcTrainingTask', wcTrainingTask);

  function wcTrainingTask() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/socialtest/templates/leaderboard/task/leaderboard-task.html',
      scope: {},
      controller: wcTrainingTaskCtrl,
      controllerAs: 'leadertaskvm'
    };

    function link(scope, elm, attrs) {

    }
    return directive;
  }
  wcTrainingTaskCtrl.$inject = ['$scope', '$sce', 'wcTrainingTaskSvc'];

  function wcTrainingTaskCtrl($scope, $sce, wcTrainingTaskSvc) {
    var leadertaskvm = this;

    leadertaskvm.truncate = truncate;
    
    /**************
     *    METHODS
     ****************/


    /****************
     *  PROPERTIES
     ****************/

    function truncate(stringValue) {

      var returnString = '';

      if (stringValue.length > 20) {

        returnString = stringValue.substring(0, 15) +"...";

      } else {

        returnString = stringValue;

      }

      return returnString;
    }


    function init() {

      wcTrainingTaskSvc
        .getData()
        .then(function (res) {
          leadertaskvm.taskList = res;
        });

    }

    function method1() {

    }


    init();
  }
})();