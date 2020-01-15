(function () {
  'use strict';

  reconnectApp
      .directive('filterDir', filterDir)
      .controller('filterCtrl', filterCtrl);

  /** @ngInject */
  function filterDir() {

      var directive = {
          controller: filterCtrl,
          controllerAs: 'filtervm',
          restrict: 'AE',
          scope: {
              inputFilters: "@",
              inputShowFilters: "@",
              inputClearFilters: "@"
          },
          templateUrl: "/_layouts/15/Connect/templates/filter/filter.html"
      }
      return directive;
  }

  filterCtrl.$inject = ['$scope', 'common','filterSvc'];
  /** @ngInject */
  function filterCtrl($scope, common, filterSvc) {
      var filtervm = this;
      filtervm.filters;
      filtervm.showFilterBar = false;

      function init() {
          filtervm.filters = $scope.inputFilters || []; // An array of objects
          filtervm.showFilterBar = $scope.inputShowFilters || filterSvc.getFilterBarVisibility();
          filtervm.clear = $scope.inputClearFilters || clear;

          if (filtervm.filters) {
              filterSvc.setFilter(filtervm.filters);
          }
      }

      /**
       * clear(prop, val) 
       * Clears an individual filter then refreshes the feed. 
       * @param {string} prop
       * @param {string} val
       */
      function clear(prop, val) {
          var currentFilters = filterSvc.getFilter();
          var newFilters = {};
          newFilters = common.clearObjectProperty(currentFilters,prop,val);
          newFilters = common.reconstructPropertyIntoObject(newFilters,"postcategories",";");
          newFilters = common.reconstructPropertyIntoObject(newFilters,"tags",";");
          $scope.$emit('refreshFilters', newFilters);
          filterSvc.setFilter(newFilters);
      }

      // Watcher for filter object
      $scope.$watch(
          function () {
              var filters = filterSvc.getFilter();
              return filters;
          },
          function (newVal, oldVal, scope) {
              var changedValue = newVal; 
              scope.filtervm.showFilterBar = true;
              changedValue = common.deconstructPropertyIntoObject(newVal,"postcategories",";")
              changedValue = common.deconstructPropertyIntoObject(newVal,"tags",";")
              scope.filtervm.filters = changedValue;
              if (!changedValue["text"] && !changedValue["postcategories"] && !changedValue["tags"]) {
                  scope.filtervm.showFilterBar = false;
                  scope.$parent.feedvm.filterPane.view.filtersApplied=false;
              }
          },true
      );

      init();

  }

}());