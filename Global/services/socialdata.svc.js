(function () {
  'use strict';

  reconnectApp
    .factory('socialDataSvc', socialDataSvc);

  socialDataSvc.$inject = ['$q', 'go', 'pplSvc', 'common'];

  function socialDataSvc($q, go, pplSvc, common) {

    var service = {
      getUserOfficeTimezone: getUserOfficeTimezone,
      getSiteCategories: getSiteCategories,
      getAlertMessages: getAlertMessages,
      getAllCategories: getAllCategories,
      getSiteHashtags: getSiteHashtags,
      getCurrentUser: getCurrentUser,
      getAllUsers: getAllUsers,
      getAllSites: getAllSites
    };

    init();

    return service;

    // ============================================

    function getSiteCategories(siteUrl, force) {

      // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
      // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
      var siteCategories = common.getLocal('WCCategories-' + siteUrl);
      if (siteCategories && siteCategories!= "" && siteCategories != "[]" && !force) {
        return $q.resolve(siteCategories);
      }

      // ELSE RETRIEVE FRESH DATA
      return go
        .getHS('WCCategoriesBySite?$select=title,id&hsf=@site="' + siteUrl + '" OR site="' + siteUrl + '/"')
        .then(function (res) {
          var results = res.data.d.results;
          var arr = [];

          results.forEach(function (item) {
            arr.push({
              name: item.title,
              id: item.id
            });
          });

          // CACHE FRESH DATA TO LOCAL STORAGE
          common.saveLocal('WCCategories-' + siteUrl, arr, 1);

          return arr;
        });

    }

    function getAllCategories(force) {

      // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
      // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
      if (common.getLocal('WCCategories') && !force) {
        return $q.resolve(common.getLocal('WCCategories'));
      }

      return go
        .getHS('WCCategoriesBySite?$select=title,id')
        .then(function (res) {
          var results = res.data.d.results;
          var arr = [];
          if (results.length > 0) {
            results.forEach(function (item) {
              arr.push({
                name: item.title
              });
            });
          }
          // CACHE FRESH DATA TO LOCAL STORAGE
          common.saveLocal('WCCategories', arr, 1);

          return arr;
        });

    }

    function getAllUsers(force) {

      // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
      // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
      if (common.getLocal('WCUsers-Active') && !force) {
        return $q.resolve(common.getLocal('WCUsers-Active'));
      }

      return pplSvc.getAllUsers(true)
        .then(function (res) {

          // CACHE FRESH DATA TO LOCAL STORAGE
          common.saveLocal('WCUsers-Active', res, 1);

          return res;

        });

    }

    function getCurrentUser(force) {
      var id = _spPageContextInfo.userId;

      // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
      // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
      if (common.getLocal('WC-CurrentUser') && !force) {

        return $q.resolve(common.getLocal('WC-CurrentUser'));
      }

      return pplSvc
        .getCurrentUser(id)
        .then(function (res) {
          var results = res;
          common.saveLocal('WC-CurrentUser', results, 48);
          return results;
        });

    }

    function getAllSites(force) {

      // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
      // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
      if (common.getLocal('WCAllSites') && !force) {
        return $q.resolve(common.getLocal('WCAllSites'));
      }

      return go
        .getHS('WCSites?$select=linkwithslash,title,id')
        .then(function (res) {
          var results = res.data.d.results;
          var arr = [];

          results.forEach(function (site) {
            arr.push({
              id: site.id,
              name: site.title,
              link: site.linkwithslash
            });
          });
          // CACHE FRESH DATA TO LOCAL STORAGE
          common.saveLocal('WCAllSites', arr, 48);
          return arr;

        });

    }

    function filterTags(tags,term){
      if(!term) return [];
      var id = 0;
      var arr = [];
      var searchTerm = term.toLowerCase();
      var tagTerm = "";
      tags.forEach(function (tag,idx,tags) {
        if(common.isArray(tags)){
          var name = (tag.hasOwnProperty("title")) ? "title" : "name";
          tagTerm = tag[name].toLowerCase();
          if(tagTerm.startsWith("#"+searchTerm)){
            arr.push({
              name: tag[name],
              id: id
            });
          }
        }else{
          tagTerm = tag.toLowerCase();
          if(tagTerm.startsWith("#"+searchTerm)){
            arr.push({
              name: tag[name],
              id: id
            });
          }
        }

        id++;
      });

      return arr;
    }

    function getSiteHashtags(force, term) {
      // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
      // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
      // if (common.getLocal('WCHashtags') && !force) {
      //   var tags = "";
      //   if(term){
      //     tags = (common.getLocal('WCHashtags-'+term)) ? common.getLocal('WCHashtags-'+term) : tags;
      //     if(common.isNullOrWhitespace(tags)){
      //       tags = common.getLocal('WCHashtags')
      //       tags = filterTags(tags,term);
      //       // SAVE TERM RESULTS TO LOCAL STORAGE
      //       common.saveLocal('WCHashtags-'+term, tags, 1);
      //     }
      //   }else{
      //     tags = common.getLocal('WCHashtags');
      //   }
      //   return $q.resolve(tags);
      // }
      var subquery = 'WCHashtags?$select=id,name';
      // Removed title filter. 
      // Instead, we rest call always runs to get all hashtags.
      // Then we cache them based on search term
      // subquery = (term) ? subquery + "&hsf=@title=%23" + term + "*" : subquery;
      return go
        .getHS(subquery)
        .then(function (res) {
          var results = res.data.d.results;
          var arr = [];
          if(term){
            arr = filterTags(results,term);
            //common.saveLocal('WCHashtags-'+term, arr, 1)
          }else{
            arr = results;
                      // CACHE FRESH DATA TO LOCAL STORAGE
            //common.saveLocal('WCHashtags', arr, 1);
          }
          
          return arr;

        });

    }

    function getAlertMessages(force) {
      if (common.getLocal('WCAlertMessages') && !force) {
        return $q.resolve(common.getLocal('WCAlertMessages'));
      }

      return go
        .getHS('WCAlertMessages?$select=message,actions,grouping,postaction,recipient')
        .then(function (res) {
          var results = res.data.d.results;
          var parsedData = {};

          results.forEach(function (message) {
            var postaction = message.postaction;
            var recipient = message.recipient;
            var grouping = message.grouping;

            if (parsedData.hasOwnProperty(grouping) && parsedData[grouping].hasOwnProperty(postaction) && parsedData[grouping][postaction].hasOwnProperty(recipient)) {
              parsedData[grouping][postaction][recipient].push(message);

            } else if (parsedData.hasOwnProperty(grouping) && parsedData[grouping].hasOwnProperty(postaction)) {
              parsedData[grouping][postaction][recipient] = []
              parsedData[grouping][postaction][recipient].push(message);

            } else if (parsedData.hasOwnProperty(grouping)) {
              parsedData[grouping][postaction] = {};
              parsedData[grouping][postaction][recipient] = []
              parsedData[grouping][postaction][recipient].push(message);

            } else {
              parsedData[grouping] = {};
              parsedData[grouping][postaction] = {};
              parsedData[grouping][postaction][recipient] = []
              parsedData[grouping][postaction][recipient].push(message);

            }

          });

          // CACHE FRESH DATA TO LOCAL STORAGE
          common.saveLocal('WCAlertMessages', parsedData, 24);

          return parsedData;
        });

    }

    function getUserOfficeTimezone(userId, force) {
      if (common.getLocal('WCUserTimezone') && !force) {
        return $q.resolve(common.getLocal('WCUserTimezone'));
      }

      return go
        .getHS('WCTimezones?$select=name,office,timezone,timezoneid,sharepointid&hsf=@sharepointid=' + userId)
        .then(function (res) {
          var results = res.data.d.results[0];

          // CACHE FRESH DATA TO LOCAL STORAGE
          common.saveLocal('WCUserTimezone', results, 24);

          return results;
        });

    }

    function init() {
      //getAlertMessages();
      getUserOfficeTimezone(_spPageContextInfo.userId);
      getCurrentUser();
      getAllUsers();
    }
  }

})();