(function(){
  'use strict';

  reconnectApp
      .factory('filterSvc', filterSvc)

      filterSvc.$inject = ['$q'];

  /** @ngInject */
  function filterSvc($q){
      var filters, showFilterBar;

      init();

      return {
          clearFilter: clearFilter,
          getFilter: getFilter,
          getFilterBarVisibility : getFilterBarVisibility,
          setFilterBarVisibility : setFilterBarVisibility,
          setFilter: setFilter
      }

      function getFilterBarVisibility(){
          return showFilterBar;
      }

      function setFilterBarVisibility(value){
          showFilterBar = value;
      }

      function setFilter(currentFilter){
          if(typeof currentFilter == "string"){
              currentFilter = JSON.parse(currentFilter);
          }
          //if(common.isArray(currentFilter)){
              filters = currentFilter;
          //}

      }

      function getFilter(){
          return filters;
      }

      function clearFilter(){
              
      }

      function init(){
          filters = [];
      }

  }

})();