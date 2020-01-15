(function () {
  'use strict';

  reconnectApp
    .directive('wcUpcomingSessions', wcUpcomingSessions);

  function wcUpcomingSessions() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/socialtest/templates/leaderboard/upcomingsessions/leaderboard-upcomingsessions.html',
      scope: {
      },
      controller: wcUpcomingSessionsCtrl,
      controllerAs: 'sessionvm'
    };

    function link(scope, elm, attrs) {

    }
    return directive;
  }

  wcUpcomingSessionsCtrl.$inject = ['$scope','$sce','wcUpcomingSessionsSvc','timezone'];

  function wcUpcomingSessionsCtrl($scope,$sce,wcUpcomingSessionsSvc,timezone) {

    var sessionvm = this;

    sessionvm.processDate = processDate;

    sessionvm.truncate = truncate;
    
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


    function getSessionList(){

        wcUpcomingSessionsSvc.getData().then(function (data) {
         sessionvm.sessionlist = data;
        });;

    }

    function processDate(date, noFromNow, format) {
      if (!date) return;
      if (!format || format == '') format = "MMM DD YYYY h:mma";
      date = timezone.getFormattedDateTime(date, noFromNow, format);
      return date;
    }


    function init() {
      getSessionList();
    }


    init();
  }
})();