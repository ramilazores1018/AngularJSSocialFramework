(function () {

  reconnectApp.directive('potluckdir', function () {
    return {
      scope: {},

      templateUrl: '/_layouts/15/Connect/templates/potluck/potluck.html',
      controller: ['$scope', 'go', '$sce', function ($scope, go, $sce) {


        function getpotluck() {

          $scope.currentUser = (JSON.parse(window.localStorage.getItem('WC-CurrentUser')).name);

          go.get(_spPageContextInfo.webAbsoluteUrl + '/_api/web/lists/getByTitle(\'Potluck\')/items')

            .then(function (data) {

              $scope.items = data.data.d.results;
             
            });

        }

        $scope.saveinput = function () {

          var obj = {
            '__metadata': {
              'type': 'SP.Data.PotluckListItem'
            },

            "Item": $scope.Item,
            "NameId": _spPageContextInfo.userId
          };

          go.post(_spPageContextInfo.webAbsoluteUrl + '/_api/web/lists/getByTitle(\'Potluck\')/items', obj)
            .then(function () {
              location.reload();
            });

        };







        function init() {

          getpotluck();
        }


        init();


      }]

    };

  });

}());