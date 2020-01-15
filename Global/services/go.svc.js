(function () {

  reconnectApp
    .factory("go", go);

  go.$inject = ["$http"];

  // SERVICE
  function go($http) {
    var hsUrl;

    // SET DEFAULT HEADERS
    var headers = {
      get: {
        accept: "application/json; odata=verbose",
        "content-type": "application/json; odata=verbose"
      },

      post: {
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        accept: "application/json; odata=verbose",
        "content-type": "application/json; odata=verbose"
      },

      merge: {
        "X-HTTP-Method": "MERGE",
        accept: "application/json;odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "IF-MATCH": "*"
      },

      put: {
        "X-HTTP-Method": "PUT",
        accept: "application/json;odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "IF-MATCH": "*"
      },

      remove: {
        "X-HTTP-Method": "DELETE",
        accept: "application/json;odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "IF-MATCH": "*"
      }
    };

    var service = {
      detectHSEnv: detectHSEnv,
      handleError: handleError,
      remove: remove,
      getHS: getHS,
      hsUrl: hsUrl,
      merge: merge,
      post: post,
      put: put,
      get: get
    }

    init();

    return service;

    /**
     * Method checks the environment to determine if being executed from
     * Staging or Production. Will return the Handshake base Url for that
     * environment.
     */
    function detectHSEnv() {
      "use strict";

      var handshakeUrl;

      if (_spPageContextInfo.siteAbsoluteUrl.indexOf('connect.whitecase.com') !== -1) {
        handshakeUrl = 'http://sphandshake:56789/HandshakeWebServices/odata/odata.ashx/';
    
      } else if (_spPageContextInfo.siteAbsoluteUrl.indexOf('connectstg') !== -1) {
        handshakeUrl = 'http://handshakestage:56789/HandshakeWebServices/odata/odata.ashx/';
    
      } else if (_spPageContextInfo.siteAbsoluteUrl.indexOf('em1cmap') !== -1) {
        handshakeUrl = _spPageContextInfo.siteAbsoluteUrl + ':56789/HandshakeWebServices/odata/odata.ashx/';
    
      } else if (_spPageContextInfo.siteAbsoluteUrl.indexOf('connectqa') !== -1) {
        handshakeUrl = 'http://em1cmap871:56789/HandshakeWebServices/odata/odata.ashx/';
    
      } else if (_spPageContextInfo.siteAbsoluteUrl.indexOf('connectdev') !== -1) {
        handshakeUrl = 'http://em1cmap921:56789/HandshakeWebServices/odata/odata.ashx/';
    
      } else if (_spPageContextInfo.siteAbsoluteUrl.indexOf('connectpreprod') !== -1) {
        handshakeUrl = 'http://em1cmws801:56789/HandshakeWebServices/odata/odata.ashx/';
    
      } else {
        handshakeUrl = _spPageContextInfo.siteAbsoluteUrl + ':56789/HandshakeWebServices/odata/odata.ashx/';
    
      }

      return handshakeUrl;
    }
    /**
     * GET method to retrieve data from Handshake.
     *
     * @param {string} q Handshake class name followed by odata string.
     */
    function getHS(q) {
      var uniqueToken = moment().format('mmssSS');
      var qURl = (hsUrl + q + "&hsr="+ uniqueToken +"&$callback=JSON_CALLBACK");

      // UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

      try {
        return $http.jsonp(qURl).then(
          function (res) {
            return res;
          });

      } catch (err) {
        handleError(err);
        return false;

      }

    }

    /**
     * GET method to make requests to SharePoint
     *
     * @param {string} url Full Url to resource endpoint.
     */
    function get(url) {
      "use strict";

      // UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

      try {
        return $http
          .get(url, {
            headers: headers.get
          })
          .then(
            function (res) {
              return res;
            });

      } catch (err) {
        handleError(err);
        return false;

      }

    }

    function merge(url, data) {
      "use strict";

      // UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

      try {
        return $http
          .patch(url, JSON.stringify(data), {
            headers: headers.merge
          })
          .then(
            function (res) {
              return res;
            });

      } catch (err) {
        handleError(err);
        return false;

      }

    }

    /**
     * POST method to save data back to SharePoint
     *
     * @param {string} url Full Url to resource endpoint.
     * @param {object} data Data Object
     */
    function post(url, data) {
      "use strict";

      // UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

      try {
        return $http
          .post(url, JSON.stringify(data), {
            headers: headers.post
          })
          .then(
            function (res) {
              return res;
            });

      } catch (err) {
        handleError(err);
        return false;

      }

    }

    function put(req) {
      "use strict";

      // UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

      try {
        return $http
          .put(req.url, JSON.stringify(req.data), {
            headers: headers.put
          })
          .then(
            function (res) {
              return res;
            });

      } catch (err) {
        handleError(err);
        return false;

      }

    }

    function remove(url) {
      "use strict";

      // UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);

      try {
        return $http
          .delete(url + "/recycle()", {
            headers: headers.remove
          })
          .then(
            function (res) {
              return res;
            });

      } catch (err) {
        handleError(err);
        return false;

      }

    }

    function checkNested(obj) {
      var args = Array.prototype.slice.call(arguments, 1);

      for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
          return false;
        }
        obj = obj[args[i]];
      }
      return true;
    }

    function handleError(err, req) {
      var url = _spPageContextInfo.siteAbsoluteUrl + "/admin/_api/web/lists/getByTitle('ErrorConsole')/items"; //  "http://connect.whitecase.com/admin/_api/web/lists/getByTitle('ErrorConsole')/items";
      var detail = "";
      var errMessage = "";
      var title = "";
      var browser = checkBrowser(window.browseris);
      var userId = _spPageContextInfo.userId;
      var methodName = ""
      var errorObject = {};
      if (err) {
        detail = (err.stack) ? err.stack : (err.responseJSON) ? err.responseJSON : ""
        //if(err.data) {
        if (checkNested(err, "data", "error", "message")) detail = err.data.error.message.value;
        //}
        // errMessage = (err.message) ? err.message : (err.errmessage) ? err.errmessage : (err.responseJSON) ? err.responseJSON : (err.data.error.message.value) ? err.data.error.message.value : "";
        errMessage = err.message || err.errmessage || err.responseJSON || err.data.error.message.value ||  err.statusText || "";
        title = (err.name) ? err.name : (err.statusText) ? err.statusText : title;
        methodName = (err.MethodName) ? err.MethodName : ""
        if (err.config) {
          req = (err.config.url) ? err.config.url : req;
        }
      }
      errorObject = {
        __metadata: {
          type: 'SP.Data.ErrorConsoleListItem'
        },
        Browser: browser,
        Detail: detail,
        ErrorMessage: errMessage,
        MethodName: methodName,
        Page: _spPageContextInfo.serverRequestPath,
        Request: (req) ? req : "",
        SiteTitle: _spPageContextInfo.webTitle,
        Title: title,
        UserSPID: (String(userId)) ? String(userId) : "",
        UserId: (String(userId)) ? String(userId) : "", // Same as above?
      };

      function checkBrowser(result) {
        if (!result) {
          return;
        }
        // CHROME CHECK
        if (result.chrome9up) {
          return 'Chrome';
        }
        // IE CHECK
        if (result.ie10standardUp) {
          return 'IE';
        }
      }

      $.ajax({
        url: url,
        type: "POST",
        contentType: "application/json;odata=verbose",
        data: JSON.stringify(errorObject),
        headers: headers.post,
        success: successHandleError,
        error: failHandleError
      });

      function successHandleError(data) {        
        return data;
      }

      function failHandleError(err) {
        console.error("Unable to save error to SharePoint list");
        return err;
      }
    }

    function init() {
      hsUrl = detectHSEnv();
    }

  }

})();