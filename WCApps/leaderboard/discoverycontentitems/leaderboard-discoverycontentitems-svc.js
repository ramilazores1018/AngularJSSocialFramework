(function () {
  "use strict";

  reconnectApp
    .factory("wcDiscoveryContentItemsSvc", wcDiscoveryContentItemsSvc);

  wcDiscoveryContentItemsSvc.$inject = ["go", "$q", "pplSvc"];

  // SERVICE
  function wcDiscoveryContentItemsSvc(go, $q, pplSvc) {


    var hsUrl = '';

    var service = {
      getData: getData,
    };

    init();

    return service;

    function getData(catID) {

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


              if (totalItem == 0) 
              {

                deferred.resolve(arr);

              } else {

                res.data.d.results.forEach(function (item) {

                  indexNum++;

                  if (totalItem == 1) {

                    restParam += " AND  groupname ='*" + item.title + "*'";
                  } else {

                    if (indexNum == 1) {

                      restParam += " AND ( groupname ='*" + item.title + "*'";

                    } else if (indexNum == totalItem) {

                      restParam += " OR groupname ='*" + item.title + "*')";

                    } else {

                      restParam += " OR groupname ='*" + item.title + "*'";

                    }
                  }

                });

                var itemUrl = "WCLeaderDiscoverContent?$select=title,url&hsf=@category_id=" + catID + restParam;

                  go
                  .getHS(itemUrl)
                  .then(function (resData) {

                    deferred.resolve(resData.data.d.results);

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