(function (_spPageContextInfo, moment) {
  'use strict';

  reconnectApp
    .factory('wcTrainingActivitiesSvc', wcTrainingActivitiesSvc);

  wcTrainingActivitiesSvc.$inject = ['go', '$q', 'socialDataSvc', 'timezone'];

  // SERVICE
  function wcTrainingActivitiesSvc(go, $q, socialDataSvc, timezone) {
    var currentUserLogin;
    var userCategories;

    var service = {
      getTrainingActivities: getTrainingActivites,
      getUserCategories: getUserCategories
    };


    return service;

    function getTrainingActivites() {

      return getUserCategories()
        .then(function () {
          return loadActivities();
        });

    }


    function getUserCategories() {
      var sessionUrl = 'WCLeaderTrainingGroup?$select=title&hsf=@users=\'*' + _spPageContextInfo.userId + '*\'';

      return go
        .getHS(sessionUrl)
        .then(function (res) {
          userCategories = res;
          return res.data.d.results;
        });
    }

    function loadActivities() {
      var sessionUrl = 'WCPosts?$select=id,title,event_start_date,siteurl,location&$top=50' +
        '&hso=event_start_date asc&hsf=@siteurl=\'' + _spPageContextInfo.webAbsoluteUrl +
        '/\' AND post_status=\'Published\' and  event_start_date >= {today}';
      var cats;

      if (userCategories && userCategories.length > 0) {
        cats = buildCategories(userCategories);
        sessionUrl += ' and ' + cats;
      }

      return go
        .getHS(sessionUrl)
        .then(function (res) {
          var mappedData = mapColumnsToView(res.data.d.results);
          return mapDatesToGroups(mappedData);
        });

    }

    function buildCategories(categoriesArr) {
      var cats = '(';

      categoriesArr
        .forEach(function (cat, i) {
          cats += 'post_categories =*' + cat.title + '*';

          if (categoriesArr.length >= i) {
            cat += ' or ';
          }

        });

      cats += ')';

      return cats;
    }

    function mapColumnsToView(data) {
      var arr = [];

      data
        .forEach(function (item) {
          arr.push({
            id: item.id,
            name: item.title,
            startdate: item.event_start_date,
            siteurl: item.siteurl,
            eventlocation: item.location
          });
        });

      return arr;
    }

    function mapDatesToGroups(datesArr) {
      var currentMonth = moment().format('MM');
      var today = moment().format('DD');
      var dateGroups = {
        today: [],
        thisMonth: [],
        future: []
      };

      datesArr
        .forEach(function (date) {
          var convertedDate = (timezone.convertToUsersTimezone(date.startdate)).moment;
          /*var itemMonth = moment(convertedDate).format('MM');
          var itemDay = moment(convertedDate).format('DD');

          if (itemDay == today) {
            dateGroups.today.push(date);

          } else if (itemDay > today && itemMonth === currentMonth) {
            dateGroups.thisMonth.push(date);

          } else if (moment(date.startdate).isAfter(moment().format(), 'month')) {
            dateGroups.future.push(date);

          }*/
          
          // Get "today" based from User's Timezone
          var currentTZ = moment.tz.guess();
          var today = moment.tz(new Date(), currentTZ).format();

          // Today
          if (convertedDate.isSame(today, 'day')) {
            dateGroups.today.push(date);
          } 
          // This Month
          else if (convertedDate.isSame(today, 'month')) {
            dateGroups.thisMonth.push(date);
          }          
          // Future Date
          else if (convertedDate.isAfter(today, 'month')) {
            dateGroups.future.push(date);
          }

        });

      return dateGroups;

    }

  }

}(window._spPageContextInfo, window.moment));
