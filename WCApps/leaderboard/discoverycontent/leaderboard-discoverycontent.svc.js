(function () {
  "use strict";

  reconnectApp
    .factory("wcDiscoveryContentSvc",  wcDiscoveryContentSvc);

   wcDiscoveryContentSvc.$inject = ["go", "$q"];

  // SERVICE
  function  wcDiscoveryContentSvc(go, $q) {

    var service = {
      getData: getData,
    };

    var hsUrl;

    init();

    return service;

    function getData() {
     
      var catUrl = "WCLeaderDiscoverContentCategory?$select=id,title&hso=id";

       return go
      .getHS(catUrl)
      .then(function (res) {
        return res.data.d.results;
      });
    }
    
    function init() {
      hsUrl = go.detectHSEnv();
    }
  }

})();