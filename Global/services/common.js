(function () {
  'use strict';

  reconnectApp
    .factory('common', common);

  common.$inject = ['go'];

  function common(go) {

    var service = {
      appendOptions: appendOptions,
      addLinkToImage : addLinkToImage,
      capitalize : capitalize,
      checkPostType: checkPostType,
      checkTinyEditor : checkTinyEditor,
      clearObjectProperty: clearObjectProperty,
      checkIfSinglePostView: checkIfSinglePostView,
      convertStrDelimitedToArrayOfObjects: convertStrDelimitedToArrayOfObjects,
      debounce: debounce,
      decodeHTML: decodeHTML,
      deconstructPropertyIntoObject: deconstructPropertyIntoObject,
      docResultsToJson : docResultsToJson,
      detectMobile : detectMobile,
      encodeHTMLEntities: encodeHTMLEntities,
      fixJson : fixJson,
      getCookie: getCookie,
      getDecisivSearchResultsUrl: getDecisivSearchResultsUrl,
      getFileExtension: getFileExtension,
      getFirstNonHashtagEntry: getFirstNonHashtagEntry,
      getLastSearchTerm: getLastSearchTerm,
      getLocal: getLocal,
      getMobileHelixLink : getMobileHelixLink,
      getParameterByName: getParameterByName,
      getObjValuesDelimitedBySemi: getObjValuesDelimitedBySemi,
      getObjValuesDelim: getObjValuesDelim,
      getQueryStringParameter : getQueryStringParameter,
      getRandomNumber : getRandomNumber,
      getUrlParameter: getUrlParameter,
      isArray: isArray,
      isDate : isDate,
      isMobile : isMobile,
      isNullOrWhitespace: isNullOrWhitespace,
      isNumeric: isNumeric,
      isOnHomepage : isOnHomepage,
      isMatters: isMatters,
      makeQuerablePromise: makeQuerablePromise,
      objectToArray: objectToArray,
      reconstructPropertyIntoObject: reconstructPropertyIntoObject,
      replaceAll: replaceAll,
      setCookie: setCookie,
      saveLocal: saveLocal,
      setLastSearchTermAndTab: setLastSearchTermAndTab,
      sortArrayByKey: sortArrayByKey,
      stringToBoolean : stringToBoolean,
      truncateText : truncateText,
      getSiteEditors: getSiteEditors
    };

    return service;

    function isMobile(){
        return (window.innerWidth <= 990);
    }

    function getMobileHelixLink (docId, username, isInline) {
      //documents::singlemindserver.dms_amer_d::imanage:amer/90760125.1
      //!nrtdms:0:!session:AMERICAS_DMS:!database:AMERICAS:!document:num,ver:
      var newDocId = '',
        inline = '';
      var imanageId = docId.split('::')[2];
      var docInfo = imanageId.split('/')[1];
      var docNum = docInfo.split('.')[0];
      var docVer = docInfo.split('.')[1];
      if (typeof isInline != undefined && isInline) {
        inline = 'true';
      } else {
        inline = 'false';
      }
      
      if (imanageId.indexOf('imanage:amer') > -1) {
        newDocId = '!nrtdms:0:!session:AMERICAS_DMS:!database:AMERICAS:!document:' + docNum + ',' + docVer + ':';
      } else if (imanageId.indexOf('imanage:emea') > -1) {
        newDocId = '!nrtdms:0:!session:EMEA_DMS:!database:EMEA:!document:' + docNum + ',' + docVer + ':';
      } else if (imanageId.indexOf('imanage:asia') > -1) {
        newDocId = '!nrtdms:0:!session:ASIA_DMS:!database:ASIA:!document:' + docNum + ',' + docVer + ':';
      } else if (imanageId.indexOf('imanage:kb') > -1) {
        newDocId = '!nrtdms:0:!session:intranet_dms:!database:kmdoc:!document:' + docNum + ',' + docVer + ':';
      } else if (imanageId.indexOf('imanage:closing') > -1) {
        newDocId = '!nrtdms:0:!session:Closings_DMS:!database:Closings:!document:' + docNum + ',' + docVer + ':';
      } else if (imanageId.indexOf('imanage:compulaw') > -1) {
        newDocId = '!nrtdms:0:!session:Compulaw_DMS:!database:Compulaw:!document:' + docNum + ',' + docVer + ':';
      }
      username = cleanUsername(username);

      return "/pages/OpenDocument.aspx?fileUrl=" + mobileHelixBaseUrl + "Document/" + encodeURIComponent(Base64.encode(newDocId + "|user=" + username + "|inline=" + inline + "|domain=" + _spPageContextInfo.siteAbsoluteUrl));
    }

     function minifyJson (inJson) {
      var outJson, // the output string
        ch, // the current character
        at, // where we're at in the input string
        advance = function () {
          at += 1;
          ch = inJson.charAt(at);
        },
        skipWhite = function () {
          do {
            advance();
          } while (ch && (ch <= ' '));
        },
        append = function () {
          outJson += ch;
        },
        copyString = function () {
          while (true) {
            advance();
            append();
            if (!ch || (ch === '"')) {
              return;
            }
            if (ch === '\\') {
              advance();
              append();
            }
          }
        },
        initialize = function () {
          outJson = "";
          at = -1;
        };

      initialize();
      skipWhite();

      while (ch) {
        append();
        if (ch === '"') {
          copyString();
        }
        skipWhite();
      }
      return outJson;
    }

    function cleanUsername(username) {
      //Removes "i:0#.w|wcnet\" SharePoint network prefix and "-adm" suffix
      if (username.indexOf('\\') > 0) {
        username = username.split('\\')[1];
      }
      return username.split('-')[0];
    }

    function fixJson (input) {
      input = input.replace('w&c', 'wAndC');
      input = input.replace('W&C', 'wAndC');
      try {
        //Attempt simple parse
        return JSON.parse(input);
      } catch (e) {
        // $log.error(e, input);
        //Minify to remove spaces, new lines and tabs
        var output = minifyJson(input);
        //Remove extraneous trailing commas
        output = replaceAll(output, ',}', '}');
        output = replaceAll(output, ',]', ']');
        output = replaceAll(output, '"]"', '"],"');
        output = replaceAll(output, '"]}]"', '"]}],"');
        //output = spSvc.replaceAll(output, '"matchedTerm":', '"matchedTerm",');
        //Parse should work after input cleanup
        //return JSON.parse(spSvc.replaceAll(input, '&gt;', '>'));
        return JSON.parse(output);
      }

    }
    function docResultsToJson (results) {

      var docsData = {
        "totalDocuments": 0,
        "documents": [],
        "matchedTerms": []
      };
      if (results && results.documents) {
        //Fill matched terms
        if (results.documents.matchedTerms) {
          docsData.matchedTerms = results.documents.matchedTerms;
        }

        //Fill documents array
        if (results.documents.document && results.documents.document.length > 0) {
          //Record total rows
          if (results.documents.pagination && results.documents.pagination.approximateTotalCount) {
            docsData.totalDocuments = parseInt(results.documents.pagination.approximateTotalCount);
          } else {
            docsData.totalDocuments = results.documents.document.length;
          }
          //Discard container
          results = results.documents.document;
          //Append each row to output
          for (var i = 0; i < results.length; i++) {
            try {
              var row = docRowToJson(results[i]);
              if (row != null) docsData.documents.push(row);
            } catch (ex) {
              // $log.error(ex);
            }
          }
        }
      }

      return docsData;
    }

    function docRowToJson (resultRow) {
      //Create empty document
      var doc = {
        "pages": "", //pages
        "mimeType": "", //application
        "source": "", //documentID.source
        "collection": "", //documentID.imanageLibrary
        "number": "", //documentID.documentNumber
        "version": "", //documentID.documentVersion
        "author": "", //author
        "editor": "", //documentAuthorEditor.lastEditor
        "client": "", //clientmatter/doc_client
        "matter": "", //clientmatter/doc_matter
        "security": "", //doc_security
        "createdDate": "", //documentAuthorEditor.created
        "modifiedDate": "", //documentAuthorEditor.modified
        "title": "", //title,
        "description": "", //text
        "type": "document",
        "actionList": [],
        "docType": '',
        "docUrl": '',
        "ancestors": {
          "title": '',
          "id": '',
          "docUrl": ''
        },
        "operator": '',
        "oldDocNumber": '',
        "oldDocCollection": '',
        "imanageLibrary": '',
        "pageDescription": 'Pages'
      };

      //Document ID
      doc.id = resultRow.id;

      //Pages
      doc.pages = resultRow.pages;
      if (doc.pages == '1') {
        doc.pageDescription = 'Page';
      }

      //Mime Type
      doc.mimeType = resultRow.application;

      if (resultRow.doc_url_native != undefined && resultRow.doc_url_native.length > 0) {
        doc.docUrl = resultRow.doc_url_native;
      }

      if (resultRow.ancestors != undefined && resultRow.ancestors.length > 0) {
        doc.ancestors.title = resultRow.ancestors[0].title;
        doc.ancestors.id = resultRow.ancestors[0].id;
        if (resultRow.ancestors[0].doc_url_native != undefined && resultRow.ancestors[0].doc_url_native.length > 0) {
          doc.ancestors.docUrl = resultRow.ancestors[0].doc_url_native;
        }
      }

      //Document ID section
      if (resultRow.documentID) {
        //Source
        doc.source = resultRow.documentID.source;

        //Collection
        doc.collection = resultRow.documentID.imanageLibrary;

        //Doc Number
        doc.number = resultRow.documentID.documentNumber;

        //Doc Version
        doc.version = resultRow.documentID.documentVersion;

        //Doc Type
        doc.docType = resultRow.documentID.type;
      }

      if (resultRow.oldDocumentID) {
        doc.oldDocCollection = resultRow.oldDocumentID.oldIManageLibrary;
        doc.oldDocNumber = resultRow.oldDocumentID.oldDocumentNumber;
      }

      //Author
      doc.author = resultRow.author;

      //Author editor section
      if (resultRow.documentAuthorEditor) {
        //Editor
        doc.editor = resultRow.documentAuthorEditor.lastEditor;
        doc.operator = resultRow.documentAuthorEditor.operator;

        //Opened Date
        var createdDate = resultRow.documentAuthorEditor.created;
        if (createdDate && createdDate.length > 0) {
          doc.createdDate = getDateFromString(createdDate);
        }

        //Last Worked Date
        var modifiedDate = resultRow.documentAuthorEditor.modified;
        if (modifiedDate && modifiedDate.length > 0) {
          doc.modifiedDate = getDateFromString(modifiedDate);
        }
      }

      //Client matter section
      if (resultRow.clientmatter) {
        //Client
        doc.client = resultRow.clientmatter.client;

        //Matter
        doc.matter = resultRow.clientmatter.matter;
      }

      //Security
      doc.security = resultRow.secureDocument;

      //Title
      doc.title = resultRow.title;

      //Description
      if (resultRow.text) {
        if (isArray(resultRow.text)) {
          doc.description = resultRow.text.join(' ');
        } else {
          doc.description = resultRow.text;
        }
      }

      //ActionList
      if (resultRow.actionList) {
        doc.actionList = resultRow.actionList;
      }

      doc.imanageLibrary = getImanageLibrary(doc.id);

      return doc;
    }

    function getDateFromString (value) {
      var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
      var reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;

      if (typeof value === 'string') {
        var a = reISO.exec(value);

        if (a) return new Date(value);
        a = reMsAjax.exec(value);
        if (a) {
          var b = a[1].split(/[-+,.]/);
          return new Date(b[0] ? +b[0] : 0 - +b[1]);
        }
      }
      return value;
    };

    function getQueryStringParameter (paramToRetrieve) {
      if (window.location.search && window.location.search.length > 0) {
        var params = document.URL.split("?")[1].split("&");
        for (var i = 0; i < params.length; i = i + 1) {
          var singleParam = params[i].split("=");
          if (singleParam[0].toLowerCase() == paramToRetrieve.toLowerCase()) return singleParam[1];
        }
      }
      return '';
    }

    function truncateText(text, trimTo, trimChars) {
      var pattern = "\^(.{" + trimTo + "}[^\\s]*).*";
      var re = new RegExp(pattern);
      var chars = trimChars || '...';

      if (text.length > trimTo) {

        return text.replace(re, "$1" + chars);

      }else{
        return text;
      }

    }

    function stringToBoolean (input) {
      switch (String(input).toLowerCase().trim()) {
        case "true":
        case "yes":
        case "1":
          return true;
        case "false":
        case "no":
        case "0":
        case null:
          return false;
        default:
          return Boolean(input);
      }
    }

    function isDate(val) {
      var d = new Date(val);
      return !isNaN(d.valueOf());
    }
    function detectMobile() {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Mobile device
        return true;
      } else {
        return false;
      }
    }

    function getRandomNumber(){
      return Math.floor(Math.random() * 1000);
    }

    function makeQuerablePromise(promise) {
      // Don't modify any promise that has been already modified.
      if (promise.isResolved) return promise;
  
      // Set initial state
      var isPending = true;
      var isRejected = false;
      var isFulfilled = false;
  
      // Observe the promise, saving the fulfillment in a closure scope.
      var result = promise.then(
          function(v) {
              isFulfilled = true;
              isPending = false;
              return v; 
          }, 
          function(e) {
              isRejected = true;
              isPending = false;
              throw e; 
          }
      );
  
      result.isFulfilled = function() { return isFulfilled; };
      result.isPending = function() { return isPending; };
      result.isRejected = function() { return isRejected; };
      return result;
  }


    function checkTinyEditor(id){
      if(!id)return;
      if(!tinymce)return;
      id=id.replace("#","");
      var editor = false;
      
      if(tinymce.editors.length <= 0) return editor;
      var editors = tinymce.editors;
      for (var i = 0; i < editors.length; i++) {
        if(editors[i].id == id){
           editor =  editors[i];
        }
      }
      return editor;
    }

    function objectToArray(obj){
      var result = [];
      var result = Object.keys(obj).map(function(key) {
        return [Number(key), obj[key]];
      });
      return result;
    }

    function isMatters() {
      return _spPageContextInfo.webTitle === 'Matters' ? true : false;
    }

    function isOnHomepage(){
      return (_spPageContextInfo.webServerRelativeUrl === '/') ? true : false;
    }

    function getLastSearchTerm() {
      var term = getCookie('lastSearchTerm');
      if (isNullOrWhitespace(term) || term == 'null') {
        return '';
      }
      return term;
    }

    function getDecisivSearchResultsUrl(type, term, isAdvanced) {
      type = type.toLowerCase();

      if (!term || isNullOrWhitespace(term)) {
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

    function setLastSearchTermAndTab(term, tab) {
      setLastSearchTerm(term);
      setLastSearchTab(tab);
    }

    function setLastSearchTab(tab) {
      if (!isNullOrWhitespace(tab) && tab != 'null') {
        setCookie('lastSearchTab', tab, 30);
      }
    }

    function setLastSearchTerm(term) {
      if (!isNullOrWhitespace(term) && term != 'null') {
        setCookie('lastSearchTerm', term, 30);
      }
    }

    function getUrlParameter(sParam) {
      var pageUrl = window.location.search.substring(1);
      var urlVariables = pageUrl.split('&');
      for (var i = 0; i < urlVariables.length; i++) {
        var sParameterName = urlVariables[i].split('=');
        if (sParameterName[0].toLowerCase() == sParam.toLowerCase()) {
          return decodeURIComponent(sParameterName[1]);
        }
      }
      return null;
    };

    function setCookie(cname, cvalue, exminutes) {
      var d = new Date();
      d.setTime(d.getTime() + (exminutes * 60 * 1000));
      var expires = "expires=" + d.toUTCString();
      document.cookie = cname + "=" + cvalue + "; " + expires + '; path=/';
    }

    function getCookie(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
      }
      return "";
    }

    /**
     * appendOptions takes an object, another obect and appends its properties to the first.
     *  Any duplicates found will be overwritten onto the first object.
     *  This is useful for passing options/properties to functions that creates 3rd party Objects such as Magic Suggest.
     * @param {object} currentOptions object with properties/options as base
     * @param {object} options object with properties to add on/overwrite the first.
     *  Returns new object with combined properties
     */
    function appendOptions(baseObj, options) {
      var tempOptions = options;
      var propName = "";
      var bProps = Object.getOwnPropertyNames(options);
      for (var i = 0; i < bProps.length; i++) {
        propName = bProps[i];
        if (baseObj[propName] === tempOptions[propName]) {
          baseObj[propName] = tempOptions[propName];
        } else {
          baseObj[propName] = tempOptions[propName];
        }
      }
      return baseObj;
    }

    /**
     * This function takes in an object and a property. Returns return string of values
     * of the property delimited by semicolon
     * @param {object} obj  object
     * @param {string} prop     property
     *  Returns semicolon delimited string
     */
    function getObjValuesDelimitedBySemi(obj, prop) {
      var val = "";
      if (Array.isArray(obj)) {
        var arrayObj = obj;
        for (var index = 0; index < arrayObj.length; index++) {
          var obj = arrayObj[index];
          Object.keys(obj).forEach(function (property) {
            if (property == prop) {
              val = obj[property] + ";" + val;
            }
          });
        }
        return val;
      } else {
        Object.keys(obj).forEach(function (property) {
          if (property == prop) {
            val = obj[property] + ";" + val;
          }
        });
        return val;
      }
    }

    /**
     * This function will convert strings into an object. The string(s) need to be delimited.
     *This function requries at least 3 arguments. 
     * First argument should be the names of keys
     * 2nd and nth arguments should be the data to add into the object
     * The last argument should be the delimiter.
     * @returns
     */
    //  var result = [];
    // if(arguments.length == 2){
    //   //if 2 arguments are passed in the last should be the delimiter
    //   var items =  arguments[0];
    //   var delim = arguments[arguments.length-1];
    //     if(items == "string"){
    //         result = items.split(';');
    //     }
    // }else

    function convertStrDelimitedToArrayOfObjects(delimiter, valObj) {
      var keys = [];
      var valArr = [];
      var store = [];
      var valCount;
      var item;
      var key;
      var i, y;

      for (key in valObj) {
        keys.push(key);
        
        if (!isArray(valObj[key])) {
          store.push(valObj[key].split(delimiter));
        } else {
          // If valObj[key] is an array, push the data
          store = store.concat(valObj[key]);
        }
        
      }
      valCount = store[0].length;
      for (i = 0; i < valCount; i++) {
        item = {};
        for (y = 0; y < keys.length; y++) {
          item[keys[y]] = store[y][i];
        }
        valArr.push(item);
      }
      return valArr;
    }

    //   if (arguments.length >= 3) {
    //     var delim = arguments[arguments.length - 1];
    //     var items = [];
    //     var item = [];
    //     var key = "";
    //     var keys = arguments[0].split(delim);
    //     for (var index = 1; index < arguments.length; index++) {
    //       // index 0 should be our keys
    //       // index length-1 should the delimiter
    //       items[i] = arguments[index].split(delim);
    //     }
    //     for (var i = 0; i < items.length; i++) {
    //         for (var j = 0; j < i.length; j++) {
    //             items[i][j]
    //             key = keys[j]
    //             item[key] = items[i]
    //         }
    //     }
    //     result.push(items);
    //   }
    //   return result;
    // }

    /**
     *  This function takes in an object, a property, and a delimitter. It will return a string of values
     * of the property delimited by delim. Useful when the property to reset will change dynamically. 
     * @param {object} obj 
     * @param {string} prop 
     * @param {string} delim 
     * Returns string delimitted by passed in delim
     */
    function getObjValuesDelim(obj, prop, delim) {
      var val;
      if (Array.isArray(obj)) {
        var arrayObj = obj;
        for (var index = 0; index < arrayObj.length; index++) {
          var obj = arrayObj[index];
          Object.keys(obj).forEach(function (key) {
            if (key == prop) {
              val = (!val) ? obj[key] : val + delim + obj[key];
            }
          });
        }
        return val;
      } else {
        Object.keys(obj).forEach(function (property) {
          if (property == prop) {
            val = (!val) ? obj[property] : val + delim + obj[property];
          }
        });
        return val;
      }
    }

    /**
     *getParameterByName(name)
     * Searches url for a specific parameter name and returns its value
     * @param {string} name
     * @returns
     */
    function getParameterByName(name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(window.location.search);
      return results === null ? "" : window.decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function isNullOrWhitespace(input) {
      if (typeof input === 'undefined' || input == null) return true;
      return input.toString().replace(/\s/g, '').length < 1;
    }

    function replaceAll(str, find, replace) {
      return str.toString().replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
    }

    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function isArray(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

    function capitalize(term){
        if (!term) { return ''; }
        return term.substr(0, 1).toUpperCase() + term.slice(1);
    
    }

        /**
     * AddLinkToImage
     * Accepts digest as string. Scans it for image tags. Wraps them with an anchor tag with the url of the image.
     * @param {string} digest
     * @returns digest modified with anchor tags as string
     */
     function addLinkToImage(digest) {
      if (!digest) return;
      var digest = "<div>" + digest + "</div>"; // WRAP DIGEST WITH DIV TAGS SINCE WE DON'T KNOW WHAT'S COMING IN
      var $digest = angular.element(digest);
      if ($digest.length < 1) return digest;
      var $images = $digest.find("img");
      if ($images.length < 1) return digest;
      // WE HAVE IMAGES TO WORK ON
      var aTags = [];
      $images.each(function (idx, img) {
        // MAKE SURE IMAGE ISN'T WRAPPED BY AN A TAG BEFORE CREATING AN A TAG AND WRAPPING IT AGAIN
        if($(img).parent()[0].tagName !="A"){
          var aTag = document.createElement("a");
          aTag.target = "_blank";
          aTag.href = img.src;
          aTag.innerHTML = img.outerHTML;
          aTags.push(aTag);
        }
      });

      if(aTags.length > 0) $digest.find("img").replaceWith(function(idx,img){ 
        return aTags[idx]; 
      });

      return $digest.html();
    }

    /**
     * This function will take provided prop and find any properties in the object with the same name.
     * Delete those references and add the value to a string seperated by provided delim.
     * The string will become part of a new property on the object.
     * @param {object} obj object
     * @param {string} prop property
     * @param {string} delim    delimiter
     *  Returns object with new property added on.
     */
    function reconstructPropertyIntoObject(obj, prop, delim) {
      var tempProp = "";
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        if (key.indexOf(prop) >= 0) {
          tempProp = (tempProp) ? tempProp + delim + obj[key] : obj[key];
          delete obj[key];
        }
      }
      obj[prop] = tempProp;
      return obj;
    }

    function getFileExtension(filename) {
      // use some regular expression goodness to match the appropriate file extension
      var pattern = /\.[0-9a-z]+$/i;
      // extract file extension 
      var ext = (filename).match(pattern);
      ext = ext[0].toLowerCase();
      return ext;
    }

    /**
     * This function will remove a property from an object.
     * Break it apart by provided delim and readd the property to the object..
     * @param {object} obj  object to work on
     * @param {string} prop     property to remove from object.
     * @param {string} delim    delimiter value
     * Returns a new object with additional properties and original deleted.
     */
    function deconstructPropertyIntoObject(obj, prop, delim) {
      if (obj[prop].indexOf(delim) > 0) {
        var cats = obj[prop].split(delim);
        delete obj[prop];
        if (cats.length > 0) {
          cats.forEach(function (elm, idx) {
            if (elm != delim) {
              if (idx == 0) {
                obj[prop] = elm;
              } else {
                obj[prop + idx] = elm;
              }
            }
          });
        }
      }
      return obj;
    }

    function encodeHTMLEntities(str) {
      return str.replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }

    function decodeHTMLEntities(str) {
      var elm = document.createElement("textarea");

    }

    function checkIfSinglePostView() {
      var result = getParameterByName('pID') ? true : false;
      return result;
    }

    /**
     * This function will decode html characterts deeper than the standard decodeURI
     * Use this function if you are having trouble decoding some characters.
     * @param {string} strToDecode 
     * Returns decoded string.
     */
    function decodeHTML(strToDecode) {
      var decode = "";
      var txt = document.createElement("textarea");
      try {

        txt.innerHTML = strToDecode;
        decode = txt.value;
        decode = decodeURIComponent(decode);

        return decode;
      } catch (err) {
        // Removed handleError. Decode failed too many times and bombed the error list.
        // go.handleError(err);
        return strToDecode; // decode can fail if there are invalid characters. So we'll return the string anyway.
      }
    }

    /**
     * This function will reset the value of a specified property in an object
     * @param {object} obj  object 
     * @param {string} prop     property to reset
     * @param {string} val     value of property
     *  Returns new object
     */
    function clearObjectProperty(obj, prop, val) {
      var newObj = {};
      for (var key in obj) {
        // skip loop if the property is from prototype
        if (!obj.hasOwnProperty(key)) continue;
        if (key == prop && obj[key] == val) {
          newObj[key] = "";
        } else {
          newObj[key] = obj[key];
        };
      }
      return newObj;
    }

    function checkToken(token) {
      if (!token) return;

      var expiresOn = moment(token.created).add(token.expires, 'hours');
      var today = moment();

      if (today.isAfter(expiresOn)) {
        return false;
      }

      return true;

    }

    function getLocal(key) {
      var token = window.localStorage.getItem(key + '-saveToken') ? JSON.parse(window.localStorage.getItem(key + '-saveToken')) : false;
      var result = window.localStorage.getItem(key);

      if (!checkToken(token) || result == null || result == 'undefined') {
        return false;
      }

      if (result !== null && result !== undefined) {
        if ((result.indexOf("{") >= 0 && result.indexOf("}") >= 0)
          || (result.indexOf("[") >= 0 && result.indexOf("]") >= 0)) {
          return JSON.parse(result);
        }
        else {
          return result;
        }
      }

      return false;

    }

    function saveLocal(key, data, expiresInHours) {
      var dateKey = key + '-saveToken';

      if (!expiresInHours) {
        expiresInHours = 0;
      }

      var token = {
        expires: expiresInHours,
        created: moment()
      };
      data = (typeof data == "string") ? data : JSON.stringify(data);
      window.localStorage.setItem(key, data);
      window.localStorage.setItem(dateKey, JSON.stringify(token));
    }

    /**
     * Determines value of postType by looking at other properties.
     * @param {object} post     post object
     * Returns one of three string values: Task, Event, or Post
     */
    function checkPostType(post) {
      if (post.hasOwnProperty('Task') || post.hasOwnProperty('task')) {
        if (post.Task || post.task) return 'Task';
      }
      if (post.hasOwnProperty('isEvent') || post.hasOwnProperty('isevent')) {
        if (post.isEvent || post.isevent) return 'Event';
      }
      return 'Post';
    }

    function debounce(func, wait, immediate) {
      var timeout;
      return function () {
        var context = this,
          args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    }

    //Sort an array by key, default order is Ascending
    function sortArrayByKey(array, key, isAscending) {
      return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if (isAscending == undefined || isAscending) {
          return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        } else {
          return ((x > y) ? -1 : ((x < y) ? 1 : 0));
        }
      });
    }

    /**
     * Returns the 1st non hashtag entry of an array.
     * This was originally developed to format Education and Language List
     * in Person Detail Page.
     * @param {*} hashtagDelimitedArray
     * Ex.  #LLB, Tel Aviv University, 1995#Tel Aviv University#
     *      #Bachelor of Arts, Tel Aviv University, 1995#Tel Aviv University#
     * 
     * @return formatted array
     * Ex.  LLB, Tel Aviv University, 1995
     *      Bachelor of Arts, Tel Aviv University, 1995
     */
    function getFirstNonHashtagEntry(hashtagDelimitedArray) {      
      var formattedResult = [];
      for (var i = 0; i < hashtagDelimitedArray.length; i++) {
        var currentItem = hashtagDelimitedArray[i];
        var splitArray = currentItem.split('#');
        if (splitArray.length >= 2) formattedResult.push(splitArray[1]);
      }
      return formattedResult;
    }

    /**
     * This function will return users with elevated access to the current site. It takes it
     * from the All Sites list in Connect Homepage.
     */
    function getSiteEditors() {

      // All Sites list from root site
      //var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'All Sites\')/items';      
      return go
        .getHS('WCSites?$select=id,link,site_editors_id,site_manager_id,site_owner_id')
        .then(function (res) {
          
          // There are default Site Editors coming from GTS Team. Their SharePoint IDs are listed below.
          var elevatedUsers = ["9273", "9783", "9809", "328"];

          var results = res.data.d.results;

          // Loop through the list of Sites
          for (var i = 0; i < results.length; i++) {
            // Get the Site Editors, Managers and Owners of the current site
            if (results[i].link == _spPageContextInfo.webAbsoluteUrl, ';') {
              var editorsArray = stringToArray(results[i].site_editors_id, ';');
              var ownersArray = stringToArray(results[i].site_owner_id, ';');
              var managersArray = stringToArray(results[i].site_manager_id, ';');
              elevatedUsers = elevatedUsers.concat(editorsArray, ownersArray, managersArray);
            }
          }
          
          // Store the users with elevated access to browser storage
          if (elevatedUsers.length > 0) saveLocal('SiteEditors', elevatedUsers, 1);

        });
    }

    function stringToArray(str, delimiter) {

      if (!str) return [];

      // If no delimiter is provided, default is semi-colon ';'
      if (!delimiter) delimiter = ';';
      
      var arr = [];
      if (str.indexOf(delimiter) >= 0) {
        str = str.split(delimiter);
        str.forEach(function (id) {
          arr.push(id);
        });
      } else {
        // One ID
        arr.push(str);
      }
      return arr;
    }

  }

}());