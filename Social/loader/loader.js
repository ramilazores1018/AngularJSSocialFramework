(function () {
  'use strict';

  reconnectApp
    .directive('wcLoader', wcLoaderDir);

  function wcLoaderDir() {
    var directive = {
      templateUrl: '/_layouts/15/Connect/templates/Loader/loader.html',
      scope: {
        inputLoadingMessage: '@'
      },
      controller: wcLoaderCtrl,
      controllerAs: 'loadervm'
    };
    return directive;
  }
  wcLoaderCtrl.$inject = ['$scope'];

  function wcLoaderCtrl($scope) {
    var loadervm = this;

    loadervm.loadingText = $scope.inputLoadingMessage || 'Loading more posts...';
  }

})();
