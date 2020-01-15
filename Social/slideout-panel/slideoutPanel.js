(function () {
  'use strict';

  reconnectApp
      .directive('slideoutPanel', slideoutPanelDir)
      .controller('slideoutPanelCtrl', slideoutPanelCtrl);

  /** @ngInject */
  function slideoutPanelDir() {

      function link() {

      }

      var directive = {
          // bindToController: true,
          controller: slideoutPanelCtrl,
          controllerAs: 'panelvm',
          // link: link,
          restrict: 'AE',
          scope: {
              inputPostId: '@',
              showPanel: '@',

          },
          templateUrl: "/_layouts/15/Connect/templates/slideoutpanel/slideoutpanel.html"
      }
      return directive;
  }

  slideoutPanelCtrl.$inject = ["$scope"];
  /** @ngInject */
  function slideoutPanelCtrl($scope) {
      var panelvm = this;

      init();

      function init() {
          panelvm.posId = $scope.inputPostId || 0;
          panelvm.showPanel = $scope.showPanel || true;
          // toggleSlideout();

      }

  }

  function toggleSlideout(slideoutContainerElm, triggerElm) {
      slideoutContainerElm = (slideoutContainerElm) ? "#" + slideoutContainerElm : "#slideOut";
      triggerElm = (triggerElm) ? "#" + triggerElm : "#slideOutTab";

      this.$slideOut = angular.element(slideoutContainerElm);
      // Slideout show
      this.$slideOut.find('.slideOutTab').on('click', function () {
          angular.element("#slideOut").toggleClass('showSlideOut');
      });

  }

}());