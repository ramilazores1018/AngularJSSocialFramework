//added search svc by ramil------------------------------------------------------------
//-------------------------------------------------------------------------------------
(function () {
  'use strict';

  reconnectApp
    .factory("searchSvc", searchSvc);

  searchSvc.$inject = ["$q", "go", "common", "_"];

  function searchSvc($q, go, common, _) {

    var hsUrl = go.hsUrl;
    var decisivSvcBaseUrl = 'http://search.whitecase.com/json/';

    var service = {
      getBestBets: getBestBets,
      getMatters: getMatters,
      getClients: getClients,
      getExperts: getExperts,
      getLastSearchTerm: getLastSearchTerm,
      getLastSearchTab: getLastSearchTab,
      getDecisivSearchResultsUrl: getDecisivSearchResultsUrl,
      getDecisivDetailsUrl: getDecisivDetailsUrl,
      getDecisivSession: getDecisivSession,
      getDocuments: getDocuments,
      isAdvancedSearch: isAdvancedSearch,
      loadJalc: loadJalc,
      setLastSearchTermAndTab: setLastSearchTermAndTab,
      setLastSearchTerm: setLastSearchTerm
    };

    init();

    return service;

    // ==========================================



    function loadJalc() {
      return $q(function (resolve, reject) {
        if (jQuery.jalcLoaded) {
          resolve();
        } else {
          createCachedScriptMethod();
          $.cachedScript('//connectstatic.whitecase.com/libs/jalc/1.0.0/jalc.min.js').done(resolve).fail(reject);
        }
      });
    }

    function getDecisivSession() {
      return $q(function (resolve, reject) {
        function success(x) {
          var response = JSON.parse(x);
          if (response.session && response.session.sessionId) {
            var sessionId = JSON.parse(x).session.sessionId;
            resolve(sessionId);
          } else {
            // var msg = 'Invalid session response from Decisiv.';
            // $log.error(msg, x);
            reject(msg);
          }
        }

        function err(e) {
          // $log.error('Error', e);
          reject(e);
        }

        return $.ajax(decisivSvcBaseUrl, {
          type: "GET",
          contentType: "text/plain",
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true
        }).done(success).fail(err);
      });
    };

    function createCachedScriptMethod() {
      //Workaround for scenarios where a web part reloads jQuery and kills the cachedScript method
      if (!jQuery.cachedScript) {
        jQuery.cachedScript = function (url, options) {

          // Allow user to set any option except for dataType, cache, and url
          options = $.extend(options || {}, {
            dataType: "script",
            cache: true,
            url: url
          });

          // Use $.ajax() since it is more flexible than $.getScript
          // Return the jqXHR object so we can chain callbacks
          return jQuery.ajax(options);
        };
      }
    }

    function peopleResultsToJson(results) {

      var peopleData = {
        "totalPeople": 0,
        "people": [],
        "matchedTerms": []
      };
      if (results && results.people) {
        //Fill matched terms
        if (results.people.matchedTerms) {
          peopleData.matchedTerms = results.people.matchedTerms;
        }

        //Fill people array
        if (results.people.person && results.people.person.length > 0) {
          //Record total rows
          if (results.people.pagination && results.people.pagination.approximateTotalCount) {
            peopleData.totalPeople = parseInt(results.people.pagination.approximateTotalCount);
          } else {
            peopleData.totalPeople = results.people.person.length;
          }
          //Discard container
          results = results.people.person;
          //Append each row to output
          for (var i = 0; i < results.length; i++) {
            try {
              var row = personRowToJson(results[i]);
              if (row != null) peopleData.people.push(row);
            } catch (ex) {
              go.handleError(ex);
            }
          }
        }
      }

      return peopleData;
    }

    function getExperts(searchTerm, pageSize) {
      pageSize = _.isNumber(pageSize) ? pageSize : 20;
      return $q(function (resolve, reject) {
        function success(x) {
          try {
            var d = peopleResultsToJson(common.fixJson(x));
            resolve(d);
          } catch (e) {

            go.handleError(e);
            reject(e);
          }
        }

        function err(e) {
          go.handleError(e);
          reject(e);
        }

        return $.ajax({
          url: decisivSvcBaseUrl + "?FUNCTION=SEARCH&SELECTEDSERVER=people&RM_CLIENT_ID=SpSvcGetExperts&SEARCH_ppl_job_status=Current&SEARCH_resultsize=" +
            pageSize + "&SEARCH_pagesize=" + pageSize + "&SEARCH_query=" + encodeURIComponent(searchTerm),
          type: "GET",
          localCache: true,
          cacheTTL: 1,
          contentType: "text/plain",
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true,
          dataType: 'text'
        }).done(success).fail(err);

      });
    }

    function getClients(searchTerm, pageSize) {
      pageSize = _.isNumber(pageSize) ? pageSize : 20;
      return $q(function (resolve, reject) {
        function success(x) {
          try {
            var d = clientResultsToJson(common.fixJson(x));
            resolve(d);
          } catch (e) {
            go.handleError(e);

            reject(e);
          }
        }

        function err(e) {
          go.handleError(e);

          reject(e);
        }

        return $.ajax({
          url: decisivSvcBaseUrl + "?FUNCTION=SEARCH&SELECTEDSERVER=interaction&RM_CLIENT_ID=SpSvcGetClients&SEARCH_resultsize=" +
            pageSize + "&SEARCH_pagesize=" + pageSize + "&SEARCH_query=" + encodeURIComponent(searchTerm),
          type: "GET",
          localCache: true,
          cacheTTL: 1,
          contentType: "text/plain",
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true,
          dataType: 'text'
        }).done(success).fail(err);
      });
    }

    function clientResultsToJson(results) {

      var clientsData = {
        "totalClients": 0,
        "clients": [],
        "matchedTerms": []
      };
      if (results && results.contacts) {
        //Fill matched terms
        if (results.contacts.matchedTerms) {
          clientsData.matchedTerms = results.contacts.matchedTerms;
        }

        //Fill clients array
        if (results.contacts.interaction && results.contacts.interaction.length > 0) {
          //Record total rows
          if (results.contacts.pagination && results.contacts.pagination.approximateTotalCount) {
            clientsData.totalClients = parseInt(results.contacts.pagination.approximateTotalCount);
          } else if (results.contacts.document) {
            clientsData.totalClients = results.contacts.document.length;
          }
          //Discard container
          results = results.contacts.interaction;
          //Append each row to output
          for (var i = 0; i < results.length; i++) {
            try {
              var row = clientRowToJson(results[i]);
              if (row != null) clientsData.clients.push(row);
            } catch (ex) {
              go.handleError(ex);
            }
          }
        }
      }

      return clientsData;
    };

    function clientRowToJson(resultRow) {
      //Create empty matter
      var client = {

        "title": "", //contact,
        "id": "", //id
        "recordType": "", //intRecordType
        "contactType": "", //int1.contactType
        "contactRole": "", //int1.contactRole
        "industry": "", //wAndCIndustry
        "type": "client"
      };

      //Title
      client.title = resultRow.contact;
      if (!client.title) return null;

      //ID
      client.id = resultRow.id;

      //Record Type
      client.recordType = resultRow.intRecordType;

      //Contact Type
      if (resultRow.int1 && resultRow.int1.contactType) {
        if (common.isArray(resultRow.int1.contactType)) {
          client.contactType = resultRow.int1.contactType.join(', ');
        } else {
          client.contactType = resultRow.int1.contactType;
        }
      }

      //Contact Role
      if (resultRow.int1 && resultRow.int1.contactRole) {
        if (common.isArray(resultRow.int1.contactRole)) {
          client.contactRole = resultRow.int1.contactRole.join(', ');
        } else {
          client.contactRole = resultRow.int1.contactRole;
        }
      }

      //Industry
      client.industry = resultRow.int1.wAndCIndustry;

      return client;
    };

    function getBestBets(searchTerm, maxRows) {

      searchTerm = searchTerm.replace(/[']/g, "''");
      searchTerm = encodeURIComponent(searchTerm);
      var maxRowsDefault = 10;

      //var url = "http://sphandshake:56789/HandshakeWebServices/odata/odata.ashx/
      var url = "WCBestBets?$select=title,reconnsynonyms,reconnurl&hsf=@reconnsynonyms='*" + searchTerm + "*'&$top=" + maxRowsDefault;
      var bestbets = {};
      return go.getHS(url)
        .then(function success(response) {
          return response.data.d.results;
        }).catch(function error(response) {
          return response;
        });
    }

    function getMatters(searchTerm, pageSize) {

      pageSize = _.isNumber(pageSize) ? pageSize : 20;

      return $q(function (resolve, reject) {
        function success(x) {
          try {
            var d = matterResultsToJson(common.fixJson(x));
            resolve(d);
          } catch (e) {
            go.handleError(e);
            reject(e);
          }
        }

        function err(e) {
          go.handleError(e);
          reject(e);
        }

        return $.ajax({
          url: decisivSvcBaseUrl + "?FUNCTION=SEARCH&SELECTEDSERVER=matters&RM_CLIENT_ID=SpSvcGetMatters&SEARCH_resultsize=" +
            pageSize + "&SEARCH_pagesize=" + pageSize + "&SEARCH_query=" + encodeURIComponent(searchTerm),
          type: "GET",
          localCache: true,
          cacheTTL: 1,
          contentType: "text/plain",
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true,
          dataType: 'text'
        }).done(success).fail(err);
      });
    }

    function matterResultsToJson(results) {
      var mattersData = {
        "totalMatters": 0,
        "matters": [],
        "matchedTerms": []
      };
      if (results && results.matters) {
        //Fill matched terms
        if (results.matters.matchedTerms) {
          mattersData.matchedTerms = results.matters.matchedTerms;
        }

        //Fill matters array
        if (results.matters.matter && results.matters.matter.length > 0) {
          //Record total rows
          if (results.matters.pagination && results.matters.pagination.approximateTotalCount) {
            mattersData.totalMatters = parseInt(results.matters.pagination.approximateTotalCount);
          } else {
            mattersData.totalMatters = results.matters.matter.length;
          }
          //Discard container
          results = results.matters.matter;
          //Append each row to output
          for (var i = 0; i < results.length; i++) {
            try {
              var row = matterRowToJson(results[i]);
              if (row != null) mattersData.matters.push(row);
            } catch (ex) {
              go.handleError(ex);

            }
          }
        }
      }

      return mattersData;
    };

    function matterRowToJson(resultRow) {
      //Create empty matter
      var matter = {
        "client": "", //matterLocationDepartment.relatedClient
        "office": "", //matterLocationDepartment.office
        "typeOfService": "", //matterLocationDepartment.typeOfService
        "status": "", //matterStatus
        "createdDate": "", //matterDates/opened
        "closedDate": "", //matterDates/closedDate
        "modifiedDate": "", //matterDates/lastWorked
        "title": "", //clientMatterName
        "description": "", //matterDescription
        "type": "matter",
        "billable": "", //matterBillable
        "responsibleAttorney": [], //responsibleAttorney
        "originatingAttorney": [], //originatingAttorney
        "billingAttorney": [], //billingAttorney
        "applicableLaw": [], //governing/applicableLaw
        "country": [], //country
        "region": [], //region
        "firmConfidential": "", //firmConfidential
        "marketingConfidential": "", //marketingConfidential
        "allowOnDealList": "", //allowOnDealList
        "topTimekeepers": [], //topTimekeepers
        "electronicClosingBinders": [], //electronicClosingBinders
        "secureMatter": "", //secureMatter
        "cases": [], //cases                
        "matterId": "", //mat_id
        "number": "", //clientMatterName[0]
        "name": "" //clientMatterName[1]
      }
      try {
        //Location department section
        if (resultRow.matterLocationDepartment) {
          //Client
          matter.client = resultRow.matterLocationDepartment.relatedClient;

          //Office
          matter.office = resultRow.matterLocationDepartment.office;

          //Type of Service
          matter.typeOfService = resultRow.matterLocationDepartment.typeOfService;
        }
      } catch (e) {
        go.handleError(e);
      }
      //Status
      matter.status = resultRow.matterStatus;

      //Dates section
      if (resultRow.matterDates) {
        try { //Opened Date
          var createdDate = resultRow.matterDates.opened;
          if (createdDate && createdDate.length > 0) {
            //matter.createdDate = new Date(createdDate);
            matter.createdDate = createdDate;
          }

          //Closed Date
          if (resultRow.matterDates.closed) {
            var closedDate = resultRow.matterDates.closed;
            if (closedDate && closedDate.length > 0) {
              //matter.closedDate = new Date(closedDate);
              matter.closedDate = closedDate;
            }
          }

          //Last Worked Date
          var modifiedDate = resultRow.matterDates.lastWorked;
          if (modifiedDate && modifiedDate.length > 0) {
            //matter.modifiedDate = new Date(modifiedDate);
            matter.modifiedDate = modifiedDate;
          }

        } catch (e) {
          go.handleError(e);
        }

      }

      //Title
      matter.title = common.htmlDecode(resultRow.clientMatterName);
      if (matter.title) {
        var titleParts = matter.title.split(' - ');
        matter.number = titleParts[0];
        matter.name = titleParts[1];
      }

      //Description
      if (resultRow.matterDescription) {
        matter.description = resultRow.matterDescription;
      }

      //Billable
      matter.billable = resultRow.matterBillable;

      //responsibleAttorney
      if (resultRow.responsibleAttorney) {
        matter.responsibleAttorney = resultRow.responsibleAttorney;
      }

      //originatingAttorney
      if (resultRow.originatingAttorney) {
        matter.originatingAttorney = resultRow.originatingAttorney;
      }

      //billingAttorney
      if (resultRow.billingAttorney) {
        matter.billingAttorney = resultRow.billingAttorney;
      }

      //applicableLaw
      if (resultRow.governingApplicableLaw) {
        matter.applicableLaw = resultRow.governingApplicableLaw;
      }

      //country
      if (resultRow.country) {
        matter.country = resultRow.country;
      }

      //region
      if (resultRow.region) {
        matter.region = resultRow.region;
      }

      //firmConfidential
      matter.firmConfidential = resultRow.firmConfidential;

      //marketingConfidential
      matter.marketingConfidential = resultRow.marketingConfidential;

      //allowOnDealList
      matter.allowOnDealList = resultRow.allowOnDealList;

      //topTimekeepers
      if (resultRow.topTimekeepers) {
        matter.topTimekeepers = resultRow.topTimekeepers;
      }

      //electronicClosingBinders
      if (resultRow.electronicClosingBinders) {
        matter.electronicClosingBinders = resultRow.electronicClosingBinders;
      }

      //secureMatter
      matter.secureMatter = resultRow.secureMatter;

      //cases
      if (resultRow.cases) {
        matter.cases = resultRow.cases;
      }

      if (resultRow.profile) {
        matter.profiles = resultRow.profile;
      }

      //matterId
      matter.matterId = resultRow.id;

      return matter;
    };

    function isAdvancedSearch() {
      //Determine whether the current page or query string is considered "advanced search mode"
      var path = _spPageContextInfo.serverRequestPath.toLowerCase();
      var advancedPages = ['advancedsearch', 'advanced', 'directory'];
      var isAdvanced = false;
      _.forEach(advancedPages, function (page) {
        if (path.indexOf('/' + page + '.aspx') > 0) isAdvanced = true;
      });
      if (!isAdvanced) {
        var advancedParam = common.getQueryStringParameter('pagename');
        isAdvanced = (!common.isNullOrWhitespace(advancedParam) && advancedParam.toLowerCase() == 'advanced');
      }
      return isAdvanced;
    }

    function getLastSearchTerm() {
      var term = common.getCookie('lastSearchTerm');
      if (common.isNullOrWhitespace(term) || term == 'null') {
        return '';
      }
      return term;
    }

    function getLastSearchTab() {
      var tab = common.getCookie('lastSearchTab');
      if (!tab || tab == '') {
        tab = 'all';
      }
      return tab;
    }

    function setLastSearchTermAndTab(term, tab) {
      setLastSearchTerm(term);
      setLastSearchTab(tab);
    }

    function setLastSearchTab(tab) {
      if (!common.isNullOrWhitespace(tab) && tab != 'null') {
        setCookie('lastSearchTab', tab, 30);
      }
    }

    function setLastSearchTerm(term) {
      if (!common.isNullOrWhitespace(term) && term != 'null') {
        setCookie('lastSearchTerm', term, 30);
      }
    }

    function getDocuments(searchTerm, pageSize) {
      pageSize = _.isNumber(pageSize) ? pageSize : 20;
      //spSvc.sleep(3000);
      return $q(function (resolve, reject) {
        function success(x) {
          try {
            var d = docResultsToJson(fixJson(x));
            resolve(d);
          } catch (e) {
            // $log.error(e);
            reject(e);
          }
        }

        function err(e) {
          // $log.error('Error', e);
          reject(e);
        }

        return $.ajax({
          url: decisivSvcBaseUrl + "?FUNCTION=SEARCH&SELECTEDSERVER=documents&RM_CLIENT_ID=SpSvcGetDocuments&SEARCH_resultsize=" +
            pageSize + "&SEARCH_pagesize=" + pageSize + "&SEARCH_query=" + encodeURIComponent(searchTerm),
          type: "GET",
          localCache: true,
          cacheTTL: 1,
          contentType: "text/plain",
          xhrFields: {
            withCredentials: true
          },
          crossDomain: true,
          dataType: 'text'
        }).done(success).fail(err);

      });
    }

    function getDecisivSearchResultsUrl(type, term, isAdvanced) {
      type = type.toLowerCase();

      if (!term || common.isNullOrWhitespace(term)) {
        term = '';
      }

      var searchTerm = encodeURIComponent(term);

      switch (type) {
        case 'all':
          if (isAdvanced) {
            return '/Pages/advancedsearch.aspx?tab=all';
          }
          return '/Pages/Search.aspx?k=' + searchTerm + "&tab=all";

        case 'content':
          if (isAdvanced) {
            return '/Pages/advanced.aspx?tab=content';
          }
          return '/Pages/fullsearch.aspx?k=' + searchTerm + "&tab=content";

        default:
        case 'people':
          if (isAdvanced) {
            return '/Pages/Directory.aspx?tab=people';
          }
          return '/Pages/SearchResultsDirectory.aspx?k=' + searchTerm + "&tab=people";

        case 'clients':
          if (isAdvanced) {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?FUNCTION=PAGE&SELECTEDSERVER=interaction&PAGENAME=advanced';
          }
          return '/_layouts/15/Recommind/DecisivSearch.aspx?SEARCH_query=' + searchTerm + "&FUNCTION=SEARCH&SELECTEDSERVER=interaction&tab=clients";

        case 'docs':
          if (isAdvanced) {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?FUNCTION=PAGE&SELECTEDSERVER=documents&PAGENAME=advanced';
          }
          return '/_layouts/15/Recommind/DecisivSearch.aspx?SEARCH_query=' + searchTerm + "&FUNCTION=SEARCH&SELECTEDSERVER=documents&tab=docs";

        case 'matters':
          if (isAdvanced) {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?FUNCTION=PAGE&SELECTEDSERVER=matters&PAGENAME=advanced';
          }
          return '/_layouts/15/Recommind/DecisivSearch.aspx?SEARCH_query=' + searchTerm + "&FUNCTION=SEARCH&SELECTEDSERVER=matters&tab=matters";

        case 'experts':
          if (isAdvanced) {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?FUNCTION=PAGE&SELECTEDSERVER=people&PAGENAME=advanced';
          }
          return '/_layouts/15/Recommind/DecisivSearch.aspx?SEARCH_query=' + searchTerm + "&FUNCTION=SEARCH&SELECTEDSERVER=people&SEARCH_ppl_job_status=Current&tab=experts";

        case 'knowledge':
          return '/_layouts/15/Recommind/DecisivSearch.aspx?FUNCTION=SEARCH&selectedserver=documents&SEARCH_rm_taxonomy_doc_source=Knowledge%2BBank&SEARCH_query=' + searchTerm + '&tab=docs';
      }
    }

    function getDecisivDetailsUrl(type, docId, term, username, url) {
      if (url != undefined && url.length > 0) {
        return url;
      }

      type = type.toLowerCase();

      var docRef = encodeURIComponent(docId);
      var searchTerm = (!common.isNullOrWhitespace(term) ? '&k=' + encodeURIComponent(term) : '');
      switch (type) {
        default:
        case 'people':
          return '/Pages/PersonDetail.aspx?DOCID=' + docRef + '&tab=people' + searchTerm;

        case 'experts':
          if (isMobile()) {
            return '/Pages/PersonDetail.aspx?DOCID=' + docRef + '&tab=experts' + searchTerm;
          } else {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?selectedserver=people&FUNCTION=VIEW&DOCTYPE=rendered&DOCID=' + docRef + '&USERDEFINED_shared=true&reset=true&tab=experts' + searchTerm;
          }

        case 'clients':
          if (isMobile()) {
            return '/Pages/ContactDetail.aspx?DOCID=' + docRef + '&tab=clients' + searchTerm;
          } else {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?selectedserver=interaction&FUNCTION=VIEW&DOCTYPE=rendered&DOCID=' + docRef + '&USERDEFINED_shared=true&reset=true&tab=clients' + searchTerm;
          }

        case 'knowledge':
        case 'docs':
          if (isMobile()) {
            return common.getMobileHelixLink(docId, username, true);
          } else {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?selectedserver=documents&FUNCTION=VIEW&DOCTYPE=rendered&DOCID=' + docRef + '&USERDEFINED_shared=true&reset=true&tab=docs' + searchTerm;
          }

        case 'matters':
          if (isMobile()) {
            return '/Pages/MatterDetail.aspx?DOCID=' + docRef + '&tab=matters' + searchTerm;
          } else {
            return '/_layouts/15/Recommind/DecisivSearch.aspx?selectedserver=matters&FUNCTION=VIEW&DOCTYPE=rendered&DOCID=' + docRef + '&USERDEFINED_shared=true&reset=true&tab=matters' + searchTerm;
          }
      }
    }

    function init() {

    }
  }

})();

//added search svc by ramil------------------------------------------------------------
//-------------------------------------------------------------------------------------