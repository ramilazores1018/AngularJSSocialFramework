(function () {
  "use strict";

  reconnectApp
    .factory("wcUpcomingSessionsSvc", wcUpcomingSessionsSvc);

  wcUpcomingSessionsSvc.$inject = ["go", "$q", "pplSvc", "timezone"];

  // SERVICE
  function wcUpcomingSessionsSvc(go, $q, pplSvc, timezone) {

    var service = {
      getData: getData,
    };

    var hsUrl;

    init();

    return service;

    function getData() {



      var deferred = $q.defer();


      pplSvc.getUserById(_spPageContextInfo.userId, 'networklogin')
        .then(function (username) {

          var lognameName = 'wcnet\\' + username.networklogin;

          var catUrl = "WCLeaderTrainingGroup?$select=title&hsf=@users='*" + lognameName + "*'";

          go
            .getHS(catUrl)
            .then(function (res) {

              var arr = [];
              var restParam = '';
              var indexNum = 0;
              var totalItem = res.data.d.results.length;


              if (totalItem == 0) {

                deferred.resolve(arr);

              } else {


                res.data.d.results.forEach(function (item) {

                  indexNum++;

                  if (totalItem == 1) {

                    restParam += " AND  post_categories ='*" + item.title + "*'";

                  } else {

                    if (indexNum == 1) {

                      restParam += " AND ( post_categories ='*" + item.title + "*'";

                    } else if (indexNum == totalItem) {

                      restParam += " OR post_categories ='*" + item.title + "*')";

                    } else {

                      restParam += " OR post_categories ='*" + item.title + "*'";

                    }
                  }

                });



                //var sessionUrl = "WCPosts?$select=id,title,event_start_date,siteurl&$top=5&hso=event_start_date&hsf=@siteurl='" + _spPageContextInfo.webAbsoluteUrl + "/' AND event_start_date >= {today} " + restParam;

                var todaysDate = moment().subtract(1, 'days').toString();
                var sessionUrl = "WCPosts?$select=id,title,event_start_date,siteurl&$top=100&hso=event_start_date&hsf=@siteurl='" + _spPageContextInfo.webAbsoluteUrl + "/' AND event_start_date > " + moment(todaysDate).format('YYYY-MM-DD') + " " + restParam;


                go
                  .getHS(sessionUrl)
                  .then(function (res) {
                    var arr = [];


                    var indexTotal = 1;

                    res.data.d.results.forEach(function (item) {



                      var currentMonth = moment().format('MM');
                      var today = moment().format('DD');
                      var todayYear = moment().format('YY');


                      var convertedDate = (timezone.convertToUsersTimezone(item.event_start_date)).moment;
                      var itemMonth = moment(convertedDate._i).format('MM');
                      var itemDay = moment(convertedDate._i).format('DD');
                      var itemYear = moment(convertedDate._i).format('YY');




                      if (((parseInt(itemMonth) > parseInt(currentMonth)) || (parseInt(itemMonth) === parseInt(currentMonth) && parseInt(itemDay) >= parseInt(today)) || (parseInt(itemYear) > parseInt(todayYear))) && indexTotal < 6) {

                        arr.push({
                          id: item.id,
                          name: item.title,
                          startdate: item.event_start_date,
                          siteurl: item.siteurl
                        });


                        indexTotal++;

                      }



                    });

                    deferred.resolve(arr);
                  });

              }


            });
        });

      return deferred.promise;

    }


    function init() {
      hsUrl = go.detectHSEnv();
    }
  }

})();