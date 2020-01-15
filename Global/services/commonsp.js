// import {Util, setup as pnpSetup} from "@pnp/common";
// import { sp } from "@pnp/sp";
// import pnp from '@pnp/sp'

(function () {
  'use strict';

  reconnectApp
    .factory('commonsp', commonsp);

  commonsp.$inject = ['$http', 'common'];
  /** @ngInject */
  function commonsp($http, common) {

    var headers = {
      get: {
        accept: 'application/json; odata=verbose',
        'content-type': 'application/json; odata=verbose'
      },

      post: {
        'X-RequestDigest': $('#__REQUESTDIGEST').val(),
        accept: 'application/json; odata=verbose',
        'content-type': 'application/json; odata=verbose'
      },

      merge: {
        'X-HTTP-Method': 'MERGE',
        accept: 'application/json;odata=verbose',
        'content-type': 'application/json;odata=verbose',
        'X-RequestDigest': $('#__REQUESTDIGEST').val(),
        'IF-MATCH': '*'
      },

      put: {
        'X-HTTP-Method': 'PUT',
        accept: 'application/json;odata=verbose',
        'content-type': 'application/json;odata=verbose',
        'X-RequestDigest': $('#__REQUESTDIGEST').val(),
        'IF-MATCH': '*'
      },

      remove: {
        'X-HTTP-Method': 'DELETE',
        accept: 'application/json;odata=verbose',
        'content-type': 'application/json;odata=verbose',
        'X-RequestDigest': $('#__REQUESTDIGEST').val(),
        'IF-MATCH': '*'
      }
    };
    // pnp.sp.setup({
    //   sp: {
    //     headers: {
    //       "Accept": 'application/json;odata=verbose',
    //       "content-type": "application/json;odata=verbose"
    //     },
    //     // baseUrl: common.setEnvironment
    //   }
    // });

    var allMethods = {
      addItem: addItem,
      getCurrentUser: getCurrentUser,
      getListItemsWithFilter: getListItemsWithFilter,
      getListItemsByUser: getListItemsByUser,
      getListItems: getListItems,
      postSPData: postSPData,
      updateListItem: updateListItem
    };

    /**
     * getSPHostUrl returns SharePoint url as staging or production.
     * If param is left out, host url will be detected based on user's url string.
     * @param {boolean} useProd - force returned url to use production  or staging
     * @param {boolean} useSubweb -true/false to detect and attach the subweb to the url. Set this to false to force the url to use the root site web only.
     */
    function getSPHostUrl(useProd, useSubweb) {
      var SPHostUrl = "";
      if (useProd == undefined) {
        if (_spPageContextInfo.siteAbsoluteUrl.indexOf('connectstg') !== -1) {
          SPHostUrl = useSubweb == false ? "http://connectstg.whitecase.com" : "http://connectstg.whitecase.com" + _spPageContextInfo.webServerRelativeUrl;
        } else {
          SPHostUrl = useSubweb == false ? "http://connect.whitecase.com" : "http://connect.whitecase.com" + _spPageContextInfo.webServerRelativeUrl;
        }
      } else if (useProd == true) {
        SPHostUrl = useSubweb == false ? "http://connect.whitecase.com" : "http://connect.whitecase.com" + _spPageContextInfo.webServerRelativeUrl;
      } else {
        SPHostUrl = useSubweb == false ? "http://connectstg.whitecase.com" : "http://connectstg.whitecase.com" + _spPageContextInfo.webServerRelativeUrl;
      }
      return SPHostUrl;
    }

    /**
     *  This function returns all items in a list where Title column is the spuserid
     * (Only useful for certain lists, timezone)
     * @param {string} Listname
     * @param {string} spuserid
     * @param { boolean} useProdUrl
     */
    function getListItemsByUser(Listname, spuserid, useProdUrl, useSubweb) {
      if (spuserid) {
        return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items?$filter=Title eq '" + spuserid + "'", true);
      }
      return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items?$filter=Title eq '" + _spPageContextInfo.userId + "'", true);
    }

    /**
     * getListItems Returns specified list items provided in the select array
     * If select is empty, this function returns all items.
     * @param {string} Listname -  name of list. No special characters.
     * @param {array} select - Array of field names to select on the REST call.
     * @param {boolean} useProdUrl - Force to use production url
     * @param {boolean} useSubweb - true/false to detect and attach the subweb to the url. Set this to false to force the url to use the root site web only.
     */
    function getListItems(Listname, select, useProdUrl, useSubweb) {
      // If you need all fields, leave select empty
      if (select) {
        var fieldsToSelect = "?$select=";
        for (var i = 0; i < select.length; i++) {
          if (i > 0) {
            fieldsToSelect += ",";
          }
          fieldsToSelect += select[i];
        }
        return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items" + fieldsToSelect, true);
      }
      return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items", true);
    }

    /**
     *
     * @param {string} Listname Name of list in SharePoint to call.
     * @param {array} select Array of fields to retrieve from the list.
     * @param {object} filter key/value pair of field to filter by. Key is the name of the field to filter and value is the value to filterby.
     * @param {boolean} useProdUrl Force hosturl be prod or staging.
     */
    function getListItemsWithFilter(Listname, select, filter, useProdUrl, useSubweb) {
      var fieldsToSelect = "$select=";
      var fieldsToFilter = "$filter=";
      var index = 0;
      var propValue = [];

      if (select && filter) {
        if (select.isArray) {
          for (var i = 0; i < select.length; i++) {
            if (i > 0) {
              fieldsToSelect += ",";
            }
            fieldsToSelect += select[i];
          }
        } else {
          fieldsToSelect += select;
        }
        if (typeof filter === 'object') {
          for (var propName in filter) {
            if (filter.hasOwnProperty(propName)) {
              propValue[index] = filter[propName];
              fieldsToFilter = fieldsToFilter + propName + " eq '" + propValue[0] + "'";
            }
          }
          return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items?" + fieldsToSelect + "&" + fieldsToFilter, true);
        }
        return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items?" + fieldsToSelect, true);
      }
      return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/lists/getbytitle('" + Listname + "')/items", true);
    }

    /**
     * Returns current user object
     * @param {boolean} useProdUrl
     */
    function getCurrentUser(useProdUrl, useSubweb) {
      return getSPData(getSPHostUrl(useProdUrl, useSubweb), "/getuserbyid(" + _spPageContextInfo.userId + ")", true);
    }

    /**
     * Returns ListItemEntityTypeFullName, used on POST and MERGE requests
     * @param {string} Listname
     * @param {boolean} useProdUrl
     */
    function getListItemEntityTypeFullName(Listname, useProdUrl) {
      return getSPData(getSPHostUrl(useProdUrl), "/lists/getbytitle('" + Listname + "')?$select=ListItemEntityTypeFullName", true);
    }

    /**
     * Returns ListItemEntityTypeFullName, used on POST and MERGE requests
     * @param {string} name
     */
    function getItemTypeForListName(name) {
      return "SP.Data." + name.charAt(0).toUpperCase() + name.slice(1) + "ListItem";
    }

    /**
     * This function will add an item to a list and return the result as a promise.
     * @param {string} Listname - name of list
     * @param {object} data - key/value pairs of fields to add.
     */
    function addItem(Listname, data, useProd, useSubweb) {
      var url = getSPHostUrl(useProd, useSubweb) + "/_api/web/lists/getbytitle('" + Listname + "')/items";
      return postSPData(url, data, Listname);
    }

    /**
     *
     * @param {string} Listname
     * @param {string} itemId
     * @param {object} data
     * @param {boolean} useProd
     * @param {boolean} useSubweb
     */
    function updateListItem(Listname, itemId, data, useProd, useSubweb) {
      var url = getSPHostUrl(useProd, useSubweb) + "/_api/web/lists/getbytitle('" + encodeURIComponent(Listname) + "')/GetItemById(" + itemId + ")";
      return updateSPData(url, data, Listname)
      // .then(function updateSPDataSuccess(result){
      //     return result;
      // })
      // .catch(function updateSPDataFail(err){
      //     return err;
      // });
    }

    /**
     *
     * @param {string} baseUrl
     * @param {string} path
     * @param {boolean} cache
     * @param {number} duration
     */
    function getSPData(baseUrl, path, cache, duration) {
      if (!baseUrl || common.isNullOrWhitespace(baseUrl)) {
        baseUrl = _spPageContextInfo.webAbsoluteUrl;
      }
      var options = {};
      if (cache) {
        if (!duration || !common.isNumeric(duration) || parseInt(duration) < 1) {
          duration = 1;
        }
        var url = baseUrl + "/_api/web" + path;
        options = {
          type: 'GET',
          dataType: 'json',
          headers: headers.get,
          xhrFields: {
            withCredentials: true
          },
          localCache: true,
          cacheTTL: duration
        };
      } else {
        options = {
          type: "GET",
          headers: {
            "Accept": "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose"
          },
          xhrFields: {
            withCredentials: true
          }
        }
      }
      url = encodeURI(url);
      return $http.get(url, options)
        .then(function success(response) {
          if (!response.d && !response.data) {
            //Missing "d" container which should always be returned
            return "Error";
          } else if (response.data.d) {
            return response.data.d;
            //Response includes result set
          } else if (response.data) {
            return response.data;
          } else {
            //Response is a single object
            return response.d;
          }
        })
        .catch(function fail(err) {
          return err;
        });
    }

    /**
     * This function is internally called for posting to SharePoint
     * @param {string} url REQUIRED
     * @param {object} postBody REQUIRED - key/value pair of fields to add
     * @param {string} listname REQUIRED - name of list to update
     * @param {string} method HTTP verb. By default its POST.
     */
    function postSPData(url, postBody, listname, method) {
      var config = {};
      if (!method) {
        method = 'POST';
      }

      if (url && postBody && listname) {
        var ListItemEntityType = getItemTypeForListName(listname);
        postBody["__metadata"] = {
          'type': ListItemEntityType
        }
        url = encodeURI(url);
        config = {
          url: url,
          data: JSON.stringify(postBody),
          method: method,
          headers: headers.post
        };
      } else {
        return "Missing required post data";
      }

      return $http(config)
        .then(function (response) {
          if (!response.d && !response.data) {
            //Missing "d" container which should always be returned
            return "Error";
          } else if (response.data.d) {
            return response.data.d;
            //Response includes result set
          } else if (response.data) {
            return response.data;
          } else {
            //Response is a single object
            return response.d;
          }
        })
        .catch(function fail(err) {
          return err
        });
    }

    /**
     * Updates a SharePoint item
     * @param {string} listTitle name of list to update
     * @param {string} itemId id of record to update
     * @param {object} itemObj key/value pair of fields to update.
     */
    function updateSPData(url, itemObj, Listname) {
      var ListItemEntityType = getItemTypeForListName(Listname);
      var data = {
        "__metadata": {
          'type': ListItemEntityType
        }
      };
      for (var prop in itemObj) {
        data[prop] = itemObj[prop];
      }

      var config = {
        url: url,
        method: "POST",
        headers: headers.merge,
        data: JSON.stringify(data)
      }

      return $http(config)
        .then(function success(response) {
          if (response) {
            return response;
          } else {
            return "error"
          }
        })
        .catch(function fail(err) {
          return err;
        })
    }

    return allMethods;
  }
})();
