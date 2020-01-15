(function () {
  'use strict';

  reconnectApp
    .directive('readmore', readmore);

  readmore.$inject = ['$timeout', '$parse', 'go'];
  /** @ngInject */
  function readmore($timeout, $parse, go) {
    var readmoreDir;

    readmoreDir = {
      controller: readmoreCtrl,
      controllerAs: 'readmorevm',
      link: link,
      require: ['^^posts', '^^feeds'],
      restrict: 'E',
      scope: {
        inputReadmoreId: "@",
        inputElmToResize: "@", // This is required. 
        inputMaxHeight: "@",
        inputMaxWidth: "@",
        inputReadmoreText: "@",
        inputReadlessText: "@",
        inputShowReadmore: "@",
        inputSkipSites: "@" // SEMICOLON SEPARATED STRING OF VALUES. CAN BE URL OR WEBTITLE
      },
      templateUrl: "/_layouts/15/Connect/templates/readmore/readmore.html",
      transclude: true,
    }

    function link(scope, elm, attrs, controllers) {
      // $timeout(function () {
      //   handleReadmore();
      // }, 1000)
      handleReadmore();

      function handleReadmore() {
        scope.readmorevm.parseSitesToSkip(controllers[0].readmoreSitesToSkip);
        if (scope.readmorevm.singlePost ||
          scope.inputShowReadmore == "false"
        ) {
          angular.element('.wc-postBody-ctn').css('padding-bottom', 0);
          $(elm).hide();
        } else {
          var digest = "";
          var heightDifference = 0;
          var paddingBottom = 0;
          var timer = (controllers[1].tab == "peopleFollowing" || controllers[1].tab == "tagsFollowing") ? 3250 : 1000 // 2nd controller should be posts
          $timeout(function () {
            try {
              resizeDigest();
            } catch (error) {
              go.handleError(error);
            }
          }, timer);
        }
      }

      function resizeDigest() {
        // SET ORIGINAL HEIGHT/WIDTH
        scope.readmorevm.inputElmToResize.originalHeight = elm.prev().height();
        scope.readmorevm.inputElmToResize.originalWidth = elm.prev().width();
        // RESIZE IF GREATER THAN maxHeight
        if (elm.prev().height() > scope.readmorevm.inputElmToResize.maxHeight) {
          elm.prev().css("max-height", elm.prev().height());
          elm.prev().height(scope.readmorevm.inputElmToResize.maxHeight);
        } else {
          // HIDE READMORE IF DIGEST CONTAINS LITTLE CONTENT
          elm.hide();
        }
      }
    }

    return readmoreDir;
  }

  readmoreCtrl.$inject = ['$scope', '$location', '$anchorScroll', 'common'];

  function readmoreCtrl($scope, $location, $anchorScroll, common) {
    var readmorevm = this;

    // METHODS
    readmorevm.toggleReadmore = toggleReadmore;
    readmorevm.expandElm = expandElm;
    readmorevm.collapseElm = collapseElm;
    readmorevm.checkIfSinglePostView = checkIfSinglePostView;
    readmorevm.parseSitesToSkip = parseSitesToSkip;

    readmorevm.expand = false;
    readmorevm.text = "";
    readmorevm.singlePost = false;

    readmorevm.inputElmToResize = {
      id: "",
      maxHeight: "",
      maxWidth: "",
      originalHeight: "",
      originalWidth: ""
    }

    // showReadMore() WILL RUN FIRST.
    // BASED ON INPUT PROPERTIES, WILL DETERMINE IF WE NEED TO INIT THE READMORE.
    function showReadMore() {
      readmorevm.inputDisableReadmore = $scope.inputDisableReadmore || false;
      parseSitesToSkip($scope.inputSkipSites)
      checkIfSinglePostView() || $scope.inputShowReadmore == "false" ? null : init();
    }

    function init() {
      // SET INITIAL VALUES
      readmorevm.readmoreText = $scope.inputReadmoreText || "Read More";
      readmorevm.readlessText = $scope.inputReadlessText || "Read Less";
      readmorevm.id = ($scope.inputReadmoreId) ? $scope.inputReadmoreId : undefined;
      readmorevm.inputElmToResize.maxHeight = ($scope.inputMaxHeight) ? $scope.inputMaxHeight : 300;
      readmorevm.inputElmToResize.maxWidth = ($scope.inputMaxWidth) ? $scope.inputMaxWidth : "100%";
      readmorevm.inputElmToResize.id = ($scope.inputElmToResize) ? $scope.inputElmToResize : undefined;
      readmorevm.text = readmorevm.readmoreText;
      readmorevm.showClass = true;
    }

    function checkIfSinglePostView() {
      var result = common.getParameterByName('pID') ? true : false;
      readmorevm.singlePost = result;
      return result;
    }

    function toggleReadmore() {
      if (readmorevm.inputElmToResize) {
        var $elmToToggle = angular.element("#" + readmorevm.inputElmToResize.id);
        readmorevm.expand = !readmorevm.expand;
        readmorevm.text = (readmorevm.text === readmorevm.readmoreText) ? readmorevm.readlessText : readmorevm.readmoreText;
        (readmorevm.expand) ? expandElm($elmToToggle): collapseElm($elmToToggle);
      }
    }

    function expandElm($elm) {
      readmorevm.showClass = false;
      $elm.animate({
        height: $elm.css("max-height")
      }, "slow")
    }

    function collapseElm($elm) {
      var location = $elm.selector;
      location = location.replace("digest", "post")
      location = location.replace("readmoreShared", "post")

      readmorevm.showClass = true;
      $elm.animate({
        height: readmorevm.inputElmToResize.maxHeight + "px"
      }, "slow");
      $("#feed-grid-ctn").animate({
        scrollTop: 0
      }, "slow");

      location = location.replace("#", "");
      // var id = String($elm[0].id.match(/\d+$/));

      $location.hash(location);
      $anchorScroll();
    }

    function parseSitesToSkip(sites){
      var hideReadmore = false;
      if (sites) {
        if (sites.indexOf(";") >= 0) {
          var sitesToSkip = sites.split(";");

          sitesToSkip.forEach(function (site, idx) {
            hideReadmore = getSiteToSkip(site);
            if (hideReadmore) $scope.inputShowReadmore = "false"
          });
        } else {
          var sitesToSkip = sites;
          hideReadmore = getSiteToSkip(sitesToSkip);
          if (hideReadmore) $scope.inputShowReadmore = "false"
        }
      }
    }

    function getSiteToSkip(site) {
      if (String(_spPageContextInfo.webTitle).toLowerCase().indexOf(site) >= 0) {
        return true;
      } else if (String(_spPageContextInfo.webServerRelativeUrl).toLowerCase().indexOf(site) >= 0) {
        return true;
      } else {
        return false;
      }
    }

    showReadMore();

  }

}());