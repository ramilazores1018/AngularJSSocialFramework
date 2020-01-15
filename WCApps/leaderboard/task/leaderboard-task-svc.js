(function () {
  "use strict";

  reconnectApp
    .factory("wcTrainingTaskSvc",  wcTrainingTaskSvc);

   wcTrainingTaskSvc.$inject = ["go", "$q"];

  // SERVICE
  function  wcTrainingTaskSvc(go, $q) {

    var service = {
      getData: getData,
    };

    var hsUrl;

    init();

    return service;

    function getData() {
    
      var taskURL="WCPosts?$select=id,title,created,taskstatus,siteurl,assignedto_id,assignedto_displayname,postcontentowner_tid&$top=5&hso=created desc&hsf=@task=1 AND taskstatus!='Completed' AND siteurl='"+ _spPageContextInfo.webAbsoluteUrl +"/' AND assignedto_id="+ _spPageContextInfo.userId;


            return go
            .getHS(taskURL)
            .then(function (res) {
            
              return res.data.d.results;

             
            });

    }
    
    function init() {
      hsUrl = go.detectHSEnv();
    }
  }

})();