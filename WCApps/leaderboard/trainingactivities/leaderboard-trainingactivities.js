(function () {
  'use strict';

  reconnectApp
    .directive('wcTrainingActivities', wcTrainingActivities);

  function wcTrainingActivities() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/socialtest/templates/leaderboard/trainingactivities/leaderboard-trainingactivities.html',
      scope: {},
      controller: wcTrainingActivitiesCtrl,
      controllerAs: 'activitiesvm'
    };

    function link(scope, elm, attrs) {

    }

    return directive;
  }

  wcTrainingActivitiesCtrl.$inject = ['$scope', '$sce', 'timezone', 'wcTrainingActivitiesSvc'];

  function wcTrainingActivitiesCtrl($scope, $sce, timezone, wcTrainingActivitiesSvc) {
    var activitiesvm = this;

    /****************
     *  PROPERTIES
     ****************/
    activitiesvm.activities = [];

    /**************
     *    METHODS
     ****************/
    activitiesvm.processDate = processDate;


    function processDate(date, noFromNow, format) {
      if (!date) return;
      if (!format || format == '') format = 'MMM DD YYYY h:mma';
      var convertedDate = timezone.convertToUsersTimezone(date).moment;
      date = timezone.getFormattedDateTime(convertedDate.format(), noFromNow, format);
      return date;
    }


    function getActivityList() {
      return wcTrainingActivitiesSvc
        .getTrainingActivities()
        .then(function (res) {
          return [
            {ctn: 'Today', data: res.today},
            {ctn: 'This Month', data: res.thisMonth},
            {ctn: 'Future Events', data: res.future}
          ];
        });
    }


    function init() {
      getActivityList()
        .then(function (res) {
          activitiesvm.activityContainers = res;
        });
    }

    init();
  }
})();