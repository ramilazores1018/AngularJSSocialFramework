(function () {
  'use strict';

  reconnectApp.directive('feeds', feedDir);

  feedDir.$inject = ['$timeout', 'common', '$q']

  function feedDir($timeout, common) {
    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/templates/Feed/interactive-feed.html',
      restrict: 'E',
      scope: {
        inputReadmoreSitesToSkip: '@',
        inputDisableComments: '@',
        inputNotOnHomepage: '@',
        inputContentOwner: '@',
        inputIsFeedHidden: '@',
        inputHomepageTab: '@',
        inputMobileGrid: '@',
        inputCategories: '@',
        inputTitlesOnly: '@',
        inputShowDrafts: '@',
        inputPostsToGet: '@',
        inputPostMode: '@',
        inputQueryFilter: '@',
        inputQueryUrl: '@',
        inputAllSites: '@',
        inputHashtags: '@',
        inputClient: '@',
        inputMatter: '@',
        inputGrid: '@',
        inputSort: '@',
        inputText: '@'
      },
      controller: feedCtrl,
      controllerAs: 'feedvm'
    };

    function link(scope, elm, attrs) {


      $timeout(function () {
        $(".wc-postBody-ctn p * span:empty").each(function () {
          if ($(this).parents("p")) $(this).parents("p").style("padding-bottom", "18.8px", "important");
        });
        $(".wc-postBody-ctn p > span:empty").each(function () {
          if ($(this).parent()) $(this).parent().style("padding-bottom", "18.8px", "important");
        });
      }, 1000, true);

      // padding-bottom: 18.8px !important;

      //Hovering over Likes
      angular.element('body').on('mouseover', function (e) {
        if ($(e.target).data('toggle') === 'popover' &&
          $(e.target).text() &&
          $(e.target).text().indexOf('#') < 0) {
          if ($(e.target)[0]) {
            var likesCount = $(e.target)[0].outerText;
            likesCount = likesCount.replace('(', '').replace(')', '');
            if (likesCount > 0) $(e.target).popover('show');
          }
        }
      });

      $('#s4-workspace').scroll(common.debounce(function () {



        if (!common.checkIfSinglePostView()) {
          // WHEN NEW POST IS CREATED AND FEED COLLAPSES IT CREATES A FALSE SCROLL VALUE
          // CHECK FOR LOADING FIXES THE ISSUE SO WE DON'T LOAD MORE UNNECESSARILY.
          // RETURN IF WE ARE ON SINGLE POST VIEW
          if (scope.feedvm.feed.isLoading == true || common.detectMobile() || common.checkIfSinglePostView()) return;
          var fromTop = $('#s4-workspace').scrollTop();
          // children()[2] is the equivalent to the feed container, assuming its still the 3rd div block in the feeds directive.
          var divHeight = $(elm.children().children()[2]).height(); // $("#feed-grid-ctn").height();

          // divHeight NEEDS TO BE POSITIVE NUMBER. ANYTHING LESS MEANS THE ELEMENT IS NOT SHOWING.
          if (fromTop >= divHeight - 750 && divHeight > 0) {
            scope.feedvm.loadMorePosts();
          }

        }

      }, 500));
    }

    return directive;
  }

  feedCtrl.$inject = [
    '$rootScope',
    '$scope',
    '$location',
    '$anchorScroll',
    'feedSvc',
    '$timeout',
    'common',
    'filterSvc',
    'hashtags',
    'socialDataSvc', '$q'
  ];

  // CONTROLLER
  function feedCtrl($rootScope, $scope, $location, $anchorScroll, feedSvc, $timeout, common, filterSvc, hashtags, socialDataSvc, $q) {
    var feedvm = this;

    // METHODS
    feedvm.handleEnterKeyEvent = handleEnterKeyEvent;
    feedvm.toggleFilterPane = toggleFilterPane;
    feedvm.initFilterBoxes = initFilterBoxes;
    feedvm.getFollowedTags = getFollowedTags;
    feedvm.toggleLoading = toggleLoading;
    feedvm.loadMorePosts = loadMorePosts;
    feedvm.clearFilters = clearFilters;
    feedvm.applyFilters = applyFilters;
    feedvm.refreshFeed = refreshFeed;
    feedvm.filterByEnterEventHndlr;
    feedvm.getFeed = getFeed;
    feedvm.hideFeed = false;

    // PROPERTIES
    feedvm.hideLoadMore = true;
    feedvm.categories = '';
    feedvm.hashtags = '';
    feedvm.followedTags = '';
    feedvm.editAccess = false;
    feedvm.deleteAccess = false;
    feedvm.tab = '';

    feedvm.totalFeedCount = 0;
    feedvm.countingInitialized = false;

    // FEED MODEL
    feedvm.feed = {
      filters: {
        siteurl: $scope.inputHSClassName || $scope.inputQueryUrl || _spPageContextInfo.webAbsoluteUrl,
        poststatus: ($scope.inputShowDrafts) ? 'Draft' : 'Published',
        postincludeonhomepage: $scope.inputNotOnHomepage || true,
        postcontentowner: $scope.inputContentOwner || '',
        postcategories: $scope.inputCategories || '',
        fromAllSites: $scope.inputAllSites || false,
        postdigest: $scope.inputText || '',
        tags: $scope.inputHashtags || '',
        matter: $scope.inputMatter || '',
        client: $scope.inputClient || '',
        title: $scope.inputText || '',
        hsf: $scope.inputQueryFilter || ''
      },
      config: {
        disableComments: $scope.inputDisableComments || false, // Pass-thru setting for Post Directive
        showTitlesOnly: $scope.inputTitlesOnly || false,
        isFeedHidden: $scope.inputIsFeedHidden || false,
        postMode: $scope.inputPostMode || 'feed', // Mode is only feed or single
        mobileGrid: $scope.inputMobileGrid || 1,
        grid: $scope.inputGrid || 1
      },
      view: {
        sort: $scope.inputSort || 'PostPublished Desc',
        top: $scope.inputPostsToGet || 5,
        skip: 0,
        loadmoreShowSpinner: false
      },
      isLoading: true,
      data: [],
      url: ''
    };

    // FILTER MODEL
    feedvm.filterPane = {
      view: {
        filtersApplied: false,
        hideFilter: false,
        isExpanded: false,
        wait: 500
      },
      showDrafts: false,
      categories: null,
      allSites: false,
      hashtags: null,
      client: '',
      matter: '',
      text: ''
    };

    // window.compileHashtags = compileHashtags;

    // MAGIC SUGGEST REFERENCES
    feedvm.savedFilters = {};
    var msCategories;
    var msHashtags;

    // * PRIVATE METHODS ====================================



    function init() {

      var promises = [];

      var isSearchPage = window.location.pathname == '/Pages/Search.aspx';
      var isHomePage = _spPageContextInfo.webServerRelativeUrl === '/';
      var isSearchingHashtag = window.location.search.indexOf('%23') !== -1;

      if (isSearchPage && !isSearchingHashtag) {
        feedvm.feed.isLoading = false;
        feedvm.hideFeed = true;
      }


      // HIDE FILTER BUTTON IF FILTER PROPERTIES WERE PASSED
      hideFilterButton();
      hideLoadMore();

      getFeed();


      promises.push(getFollowedTags());
      promises.push(getSiteCategories());
      promises.push(getSiteHashtags());
      promises.push(getFeedTotal(5));

      $q.all(promises)
        .then(function (data) {

        });



      // promises.push(getFeed());
      // promises.push(getFeedTotal(newFeedURL));

      // $q.all(promises)
      // .then(function (data) {

      // });

      //getFollowedTags().then(function (res) {});
      //getSiteCategories();
      //getSiteHashtags();

      //getFeedTotal(newFeedURL);

      if (common.getParameterByName('pID') || isSearchPage || isHomePage) {
        feedvm.filterPane.view.hideFilter = true;
      }

      // Bind debounced event handler.
      feedvm.filterByEnterEventHndlr = common.debounce(function (event) {
        handleEnterKeyEvent(event);
      }, 500);

      $scope.$on('refreshFeed', function (event, data) {
        toggleLoading();
        // CALLING REFRESHFEED DIRECTLY. IT CALLS GETFEED()
        // THIS RESETS THE SKIP PROPERTY BACK TO ZERO WHICH WE NEED IF USER HAS LOADED MORE POSTS
        refreshFeed();
        // $timeout(function () {
        //   getFeed();
        // }, 1000);
      });

    }

    function getFeedTotal(deductionNum){

      var feedUrl = '';

      if (common.getParameterByName('hashtag') || common.getParameterByName('k')) {
        feedUrl = getHashtagFeed();
      } else if (common.getParameterByName('matter') && common.getParameterByName('client')) {
        feedUrl = getMatterSiteFeed();
      } else if ($scope.inputHomepageTab) {
        feedvm.tab = $scope.inputHomepageTab
        feedUrl = getHomepageTabFeed(feedvm.tab);
      } else {
        feedUrl = getSiteFeed();
      }


      var selectPos = feedUrl.indexOf("select");
      var skipPos = feedUrl.indexOf("skip");
      
      var feedUrlSelect = feedUrl.substring(0, selectPos + 6);
      var feedUrlSkip = feedUrl.substring(skipPos-1,feedUrl.length);
      var newFeedURL = feedUrlSelect +"=PostPublished&$top=100&"+feedUrlSkip;


      return feedSvc
        .getFeed(newFeedURL)
        .then(function (res) {

          feedvm.countingInitialized = true;


          if (res.length > 5){
            feedvm.totalFeedCount = res.length - deductionNum;
          }else{
            feedvm.totalFeedCount = 0;
          }

        });

    }

    //==========================
    // * DATA CALLS
    //==========================
    function getFeed(filters, loadNext) {
      var feedUrl;

      // HASHTAGS
      if (common.getParameterByName('hashtag') || common.getParameterByName('k')) {
        feedUrl = getHashtagFeed();
        feedvm.filterPane.view.hideFilter = true;
        // MATTER SITES 
      } else if (common.getParameterByName('matter') && common.getParameterByName('client')) {
        feedUrl = getMatterSiteFeed();
        feedvm.filterPane.view.hideFilter = true;
        // HOMEPAGE TABS
      } else if ($scope.inputHomepageTab) {
        feedvm.tab = $scope.inputHomepageTab
        feedUrl = getHomepageTabFeed(feedvm.tab);
        feedvm.filterPane.view.hideFilter = true;

        // REGULAR SITE FEED
      } else {
        feedUrl = getSiteFeed(filters);

      }

      // SINGLE POST VIEW
      if (common.getParameterByName('pID')) {
        return getSinglePost();
        feedvm.filterPane.view.hideFilter = true;

      }


      return feedSvc
        .getFeed(feedUrl)
        .then(function (res) {

          feedvm.feed.isLoading = false;
          feedvm.readmoreSitesToSkip = $scope.inputReadmoreSitesToSkip
          // IF LOADING NEXT POSTS ADD TO DATASET,
          // OTHERWISE RELOAD WITH FRESH DATA
          if (loadNext) {

            res.forEach(function (post) {
              feedvm.feed.data.push(post);
            });

          } else {
            feedvm.feed.data = [];
            feedvm.feed.data = res;

            // Call the Store Pinned Post functionality
            if (res && res[0]) storePinnedPost(res[0]);

          }

          // IF THERE ARE LESS THAN 5 POSTS, ITS SAFE TO ASSUM
          if (feedvm.feed.data.length < 5 || res.length == 0) {
            // feedvm.hideLoadMore = true;
            hideLoadMore(true);
          } else {


            hideLoadMore(false);
          }

        });
    }

    /**
     * hideLoadMore
     * Used to hide the Load More Posts button in various cases.
     * @param {*} hide
     */
    function hideLoadMore(hide) {
      if (hide) {

        feedvm.feed.view.loadmoreShowSpinner = false;
        feedvm.hideLoadMore = hide;
      }
      if (common.isOnHomepage() == true) {

        feedvm.feed.view.loadmoreShowSpinner = false;
        feedvm.hideLoadMore = true;

      }
      feedvm.hideLoadMore = !common.detectMobile();
    }

    function getHashtagFeed() {
      var site = common.getParameterByName('site');
      var tag = common.getParameterByName('hashtag') ? common.getParameterByName('hashtag') : common.getParameterByName('k');

      $scope.inputHashtags = tag;
      $scope.inputHashtags = $scope.inputHashtags.replace('%23', '').replace('#', '');
      feedvm.feed.filters.postincludeonhomepage = null;

      if (common.getParameterByName('k')) {
        feedvm.feed.filters.fromAllSites = true;
      }

      if (site) {
        if ((site.indexOf("\"", 0) == 0) && (site.indexOf("\"", site.length - 1) == site.length - 1)) {
          // Remove starting and ending quotes
          site = site.substr(1, site.length - 2);
        }
        if (site.indexOf("/", site.length - 1) >= 0) {
          // Remove trailing slash
          site = site.substr(0, site.length - 1);
          //site = site.substr(0, site.length - 1);
        }
        feedvm.feed.filters.siteurl = site;
      }

      // IF SET TO ALL SITES, SET SITE URL TO NULL TO BE SKIPPED IN SETFILTERS METHOD
      if (common.getParameterByName('allsites')) {
        feedvm.feed.filters.siteurl = null;
      }

      return buildQueryUrl(feedvm.feed).url;

    }

    function getMatterSiteFeed() {
      feedvm.feed.filters.matter = common.getParameterByName('matter');
      feedvm.feed.filters.client = common.getParameterByName('client');
      if (feedvm.feed.filters.matter || feedvm.feed.filters.client) feedvm.filterPane.view.hideFilter = true;
      // IF SET TO ALL SITES, SET SITE URL TO NULL TO BE SKIPPED IN SETFILTERS METHOD
      if (common.getParameterByName('allsites')) {
        feedvm.feed.filters.siteurl = null;
      }

      return buildQueryUrl(feedvm.feed, $scope.inputHomepageTab).url;

    }

    function getSinglePost() {
      return feedSvc.getSinglePost(common.getParameterByName('pID')).then(function (res) {
        feedvm.feed.isLoading = false;
        feedvm.feed.data = res;

        if (feedvm.feed.data.length < 5) {
          // feedvm.hideLoadMore = true;
          hideLoadMore(true);
        } else {
          hideLoadMore(false);
          // feedvm.hideLoadMore = false;
        }
      });
    }

    function getHomepageTabFeed(tabName) {
      return buildQueryUrl(feedvm.feed, tabName).url;
    }

    function getSiteFeed(filters) {

      filters ? (feedvm.feed.filters = filters) : null;

      //Update Sort according to Pinned Post
      feedvm.feed.view.sort = 'PinnedPost Desc, PostPublished Desc';

      return buildQueryUrl(feedvm.feed).url;
    }

    function loadMorePosts() {


      feedvm.feed.view.skip += feedvm.feed.view.top;
      // feedvm.feed.view.loadmoreShowSpinner = true;

      if (feedvm.totalFeedCount > 0) {

        feedvm.feed.view.loadmoreShowSpinner = true;
        feedvm.totalFeedCount = feedvm.totalFeedCount - feedvm.feed.view.top;

        if (feedvm.totalFeedCount == 10) {
          getFeedTotal(5);
        }

      } else {

        feedvm.feed.view.loadmoreShowSpinner = false;
        feedvm.totalFeedCount = 0;

      }

      if ($scope.inputHomepageTab == 'sitesFollowing' && feedvm.countingInitialized == false) feedvm.feed.view.loadmoreShowSpinner = true;



      getFeed(null, true).then(function () {
        feedvm.feed.view.loadmoreShowSpinner = false;
      });


    }

    function refreshFeed() {
      feedvm.feed.isLoading = true;
      feedvm.feed.view.skip = 0;
      feedvm.feed.data = [];
      feedvm.feed.url = '';

      $timeout(function () {
        getFeed().then(function () {
          // compileHashtags();
        });
      }, 1000);
    }

    function getSiteCategories() {
      var site = _spPageContextInfo.webServerRelativeUrl;
      return feedSvc.getCategoriesForSite(site).then(function (data) {
        feedvm.categories = data;
      });
    }

    function getSiteHashtags() {
      // return feedSvc.getTagsForSite().then(function (data) {
      return socialDataSvc.getSiteHashtags().then(function (data) {
        feedvm.hashtags = data;
      });
    }

    function buildQueryUrl(feed, tabName) {
      var tabs = {
        mattersFollowing: 'WCPostsFollowingMatters',
        peopleFollowing: 'WCPostsFollowingPeople',
        tagsFollowing: 'WCPostsFollowingHashtags',
        sitesFollowing: 'WCPostsFollowing'
      };
      var filters = feed.filters;
      var view = feed.view;
      var hsClass;
      var q;

      if (tabName) {
        hsClass = tabs[$scope.inputHomepageTab] + '?';

        q = {
          web: hsClass,
          hsf: 'hsf=@poststatus=' + filters.poststatus + ' AND followinguserid=' + _spPageContextInfo.userId + ' AND postincludeonhomepage=true',
          skip: '$skip=' + view.skip,
          select: (hsClass == "WCPostsFollowingPeople?") ? feedSvc.$peopleSelect : feedSvc.$select,
          hso: 'hso=PostPublished desc',
          top: '$top=' + view.top,
          hsr: moment().format('mmssSS')
        };

        feed.url = encodeURI(q.web + q.select + '&' + q.top + '&' + q.skip + '&' + q.hso + '&' + q.hsf + '&' + q.hsr);

      } else if (_spPageContextInfo.webTitle === 'Matters') {

        delete filters['poststatus'];
        delete filters['postincludeonhomepage']; // Property not used in Matters

        q = {
          web: 'WCPosts?',
          hsf: setFilters(filters),
          select: feedSvc.$select,
          skip: '$skip=' + view.skip,
          hso: 'hso=PostPublished desc',
          top: '$top=' + view.top,
          hsr: moment().format('mmssSS')
        };

        feed.url = encodeURI(q.web + q.select + '&' + q.top + '&' + q.skip + '&' + q.hso + '&' + q.hsf + '&' + q.hsr);

      } else {

        q = {
          web: 'WCPosts?',
          hsf: setFilters(filters),
          select: feedSvc.$select,
          skip: '$skip=' + view.skip,
          hso: 'hso=' + view.sort,
          top: '$top=' + view.top
        };

        feed.url = encodeURI(
          q.web +
          q.select +
          '&' +
          q.top +
          '&' +
          q.skip +
          '&' +
          q.hso +
          '&' +
          q.hsf +
          ' AND title <> ' +
          moment().format('mmssSS')
        );
      }

      /**
       * Updated logic in filtering hashtags. Saved hashtags are prefixed by #.
       * Since # isn't covered by encodeURI and encodeURIComponent might break
       * the URL, regex replacement is the recommended approach.
       */
      feed.url = feed.url.replace(/tags=/g, 'tags=*%23');

      return feed;
    }

    function setFilters(filters) {
      var textFilterArr = [
        'title',
        'postdigest',
        'sharetitle',
        'sharedigest',
        'sharebody',
        'postcontentowner_display',
        'sharecontentowner_display'
      ];
      var cats = filters.postcategories.split(';');
      var showAllSites = filters['fromAllSites'];
      var tags = $scope.inputHashtags ? [$scope.inputHashtags] : filters.tags.split(';');
      var categoryArr = [];
      var filterArr = [];
      var hsf = 'hsf=@';
      var tagArr = [];
      var textArr = [];

      // delete filters['fromAllSites'];

      // BUILD FILTER STRING FOR EACH PROPERTY PASSED IN
      // for (var property in filters) { // Skips client matter
      Object.keys(filters).forEach(function (property) {

        if (filters.hasOwnProperty(property) && filters[property] !== '' && filters[property] !== null) {

          if (
            property === 'fromAllSites' ||
            property === 'tags' ||
            property === 'postcategories' ||
            property === 'text'
          ) {
            return;
          } else {

            if (property === 'siteurl') {
              if (showAllSites || filters.siteurl == '') {
                // filterArr.push(property + "= ''");
              } else {
                // filterArr.push(property + '=' + filters[property]);
                filterArr.push(property + "='" + filters[property] + "/'");
              }
            } else {

              if (property == 'postincludeonhomepage' && filters[property] == 'false') {
                return;
              }
              if (property == 'hsf') {
                filterArr.push(filters[property]);
              } else {
                filterArr.push(property + '=' + filters[property]);
              }
            }

          }
        }
      })

      hsf += filterArr.join(' AND ');

      tags.forEach(function (tag) {
        if (tag) {
          tagArr.push('tags=' + tag.replace('#', '') + ';*');
        }
      });

      cats.forEach(function (category) {
        if (category) {
          categoryArr.push('post_categories=*' + category + '*');
        }
      });

      if (tagArr.length > 0) {
        hsf += ' AND ' + tagArr.join(' OR ');
      }

      if (categoryArr.length > 0) {
        hsf += ' AND ' + categoryArr.join(' OR ');
      }

      if (filters.text) {
        textFilterArr.forEach(function (filter) {
          textArr.push(filter + '=*' + filters.text + '*');
        });

        hsf += ' AND (' + textArr.join(' OR ') + ')';
      }

      return hsf;
    }

    function setSiteUrl() {
      var siteurl = $scope.inputQueryUrl || _spPageContextInfo.webAbsoluteUrl;
      var allSitesParam = common.getParameterByName('allsites');
      return allSitesParam ? '' : siteurl;
    }

    //==========================
    // * VIEW TOGGLES
    //==========================

    function toggleLoading() {
      feedvm.feed.isLoading = !feedvm.feed.isLoading;
    }

    function toggleFilterPane(expandView) {
      if (expandView == false) {
        feedvm.filterPane.view.isExpanded = expandView;
      } else {
        feedvm.filterPane.view.isExpanded = !feedvm.filterPane.view.isExpanded;
      }
    }

    //==========================
    // * FILTER LOGIC+
    //==========================

    function applyFilters(filterData) {
      var filterPane = feedvm.filterPane;
      var config = feedvm.feed.config;
      var tagObj = {};
      var catObj = {};
      feedvm.filterPane.view.filtersApplied = true;
      feedvm.feed.isLoading = true;
      feedvm.feed.view.skip = 0; // RESET SKIP COUNTER
      if (filterData) {
        // Assign filters to filterPane from  pills
        // Usually this gets hit if an individual filter gets removed.
        if (filterData.postcategories) {
          var tempCatObj = [];
          var i = 0; // Index for new object
          catObj = msCategories.getSelection();
          var len = catObj.length;

          if (len > 0) {
            for (var index = 0; index < len; index++) {
              if (filterData.postcategories.indexOf(catObj[index].name) >= 0) {
                tempCatObj[i] = {
                  id: catObj[index].id,
                  name: catObj[index].name
                };
                i++;
              }
            }
            msCategories.setSelection(tempCatObj);
          }
        } else if (msCategories.getSelection() != '') {
          msCategories.clear();
          feedvm.feed.filters.postcategories = '';
        }

        if (filterData.tags) {
          var i = 0; // Index for new object
          tagObj = msHashtags.getSelection();
          var len = tagObj.length;
          var tempTagObj = [];

          if (len > 0) {
            for (var index = 0; index < len; index++) {
              if (filterData.tags.indexOf(tagObj[index].name) >= 0) {
                tempTagObj[i] = {
                  id: tempTagObj[index].id,
                  name: tempTagObj[index].name
                };
                i++;
              }
            }
            msHashtags.setSelection(tempTagObj);
          }
        } else if (msHashtags.getSelection() != '') {
          msHashtags.clear();
          feedvm.feed.filters.tags = '';
        }

        var filters = filterData;
        for (var filter in filterPane) {
          if (filterPane.hasOwnProperty(filter)) {
            if (filters[filter] !== undefined) {
              filterPane[filter] = filters[filter];
            } else if (config[filter] !== undefined) {
              filterPane[filter] = config[filter];
            }
          }
        }
        feedvm.filterPane = filterPane;
      } else {
        // Assign filters from filterPane
        var filters = feedvm.feed.filters;
        filters.postcategories = returnValAsString(msCategories.getSelection());
        filters.tags = returnValAsString(msHashtags.getSelection());

        for (var filter in filterPane) {
          if (filterPane.hasOwnProperty(filter)) {
            if (filters[filter] !== undefined) {
              filters[filter] = filterPane[filter];
            } else if (config[filter] !== undefined) {
              config[filter] = filterPane[filter];
            }
          }
        }
        filters.text = filterPane.text;

      }
      if (common.isNullOrWhitespace(filters.text) && common.isNullOrWhitespace(filters.postcategories) && common.isNullOrWhitespace(filters.tags)) {
        // NOTHING TO FILTER ON
        clearFilters();
        return;
      }

      feedvm.savedFilters.categories = JSON.stringify(msCategories.getSelection()); // filterPane.categories;
      feedvm.savedFilters.hashtags = JSON.stringify(msHashtags.getSelection()); // filterPane.hashtags;
      feedvm.savedFilters.text = filterPane.text;
      filters.postincludeonhomepage = null
      // REFRESH FEED WITH APPLIED FILTERS
      getFeed(filters).then(toggleFilterPane).then(function () {
        // compileHashtags();
        filterData ? filterSvc.setFilter(filterData) : filterSvc.setFilter(filters);
        if (filterData) {
          toggleFilterPane(false);
        }
      });
    }

    function returnValAsString(arrOfObjects) {
      var arr = [];
      if (arrOfObjects == undefined) return '';
      arrOfObjects.forEach(function (item) {
        arr.push(item.name.replace(';', ''));
      });
      return arr.join(';');
    }

    $rootScope.$on('refreshFilters', function (event, data) {
      if (data.tags == '' && data.text == '' && data.postcategories == '') {
        resetFilters();
        getFeed();
      } else {
        applyFilters(data);
      }
      toggleFilterPane(false);
    });


    $rootScope.$on('hideFilterControlOnEditMode', function (event, data) {
      feedvm.filterPane.view.hideFilter =  true;
    });


    $rootScope.$on('showFilterControlAfterEdit', function (event, data) {
      feedvm.filterPane.view.hideFilter =  false;
    });


    function clearFilters() {
      resetFilters();
      toggleFilterPane();
      refreshFeed();
    }

    function resetFilters() {
      var clearedFilters = {
        siteurl: $scope.inputQueryUrl || _spPageContextInfo.webAbsoluteUrl + '/',
        postcontentowner: $scope.inputContentOwner || '',
        fromAllSites: $scope.inputAllSites || false,
        poststatus: $scope.inputShowDrafts || 'Published',
        postcategories: $scope.inputCategories || '',
        postdigest: $scope.inputText || '',
        tags: $scope.inputHashtags || '',
        matter: $scope.inputMatter || '',
        client: $scope.inputClient || '',
        title: $scope.inputText || ''
      };

      msCategories.clear();
      msHashtags.clear();

      feedvm.filterPane.view.filtersApplied = false;
      feedvm.filterPane.text = '';
      feedvm.savedFilters = {};

      feedvm.feed.filters = clearedFilters;

      feedvm.feed = {
        filters: {
          siteurl: $scope.inputHSClassName || $scope.inputQueryUrl || _spPageContextInfo.webAbsoluteUrl,
          poststatus: ($scope.inputShowDrafts) ? 'Draft' : 'Published',
          postincludeonhomepage: $scope.inputNotOnHomepage || true,
          postcontentowner: $scope.inputContentOwner || '',
          postcategories: $scope.inputCategories || '',
          fromAllSites: $scope.inputAllSites || false,
          postdigest: $scope.inputText || '',
          tags: $scope.inputHashtags || '',
          matter: $scope.inputMatter || '',
          client: $scope.inputClient || '',
          title: $scope.inputText || ''
        },
        config: {
          disableComments: $scope.inputDisableComments || false, // Pass-thru setting for Post Directive
          showTitlesOnly: $scope.inputTitlesOnly || false,
          isFeedHidden: $scope.inputIsFeedHidden || false,
          postMode: $scope.inputPostMode || 'feed', // Mode is only feed or single
          mobileGrid: $scope.inputMobileGrid || 1,
          grid: $scope.inputGrid || 1
        },
        view: {
          sort: $scope.inputSort || 'PostPublished Desc',
          top: $scope.inputPostsToGet || 5,
          skip: 0
        },
        isLoading: true,
        data: [],
        url: ''
      };
    }

    //==========================
    // * INIT FUNCTIONS
    //==========================

    function initFilterBoxes() {
      initCategoryFilter();
      initHashtagFilter();
    }

    function initHashtagFilter() {
      var settings = {
        value: feedvm.savedFilters.hashtags ? JSON.parse(feedvm.savedFilters.hashtags) : [],
        data: feedvm.hashtags
      };

      msHashtags = $('.filter-by-hashtag').magicSuggest(settings);
    }

    function initCategoryFilter() {
      var settings = {
        value: feedvm.savedFilters.categories ? JSON.parse(feedvm.savedFilters.categories) : [],
        data: feedvm.categories
      };

      msCategories = $('.filter-by-category').magicSuggest(settings);
    }

    //==========================
    // * HASHTAG FUNCTIONALITY
    //==========================

    function getFollowedTags() {
      return feedSvc.getFollowedTags()
        .then(function (res) {
          feedvm.followedTags = '';
          feedvm.followedTags = res;
        });
    }

    // METHODS INTENTIONALLY ADDED TO WINDOW

    window.wc.followHashtag = function (tag) {
      var userId = _spPageContextInfo.userId;

      hashtags.followHashtag(tag, userId)
        .then(function (res) {
          getFollowedTags();
          wc.social.followingCtrl.getFollowedData();
        });
    };

    window.wc.unFollowHashtag = function (tag) {
      hashtags.unfollowHashtag(tag, feedvm.followedTags)
        .then(function (res) {

          getFollowedTags();
          wc.social.followingCtrl.getFollowedData();
        });
    };

    function handleEnterKeyEvent(e) {
      if (e.keyCode === 13) {
        feedvm.applyFilters();
      }
    }


    function hideFilterButton() {
      // HIDE FILTER BUTTON IF ANY OF THE FILTER INPUT PROPERTIES HAVE VALUES
      // including Matters
      if (
        $scope.inputHSClassName ||
        $scope.inputQueryUrl ||
        $scope.inputShowDrafts ||
        $scope.inputNotOnHomepage ||
        $scope.inputContentOwner ||
        $scope.inputCategories ||
        $scope.inputAllSites ||
        $scope.inputText ||
        $scope.inputHashtags ||
        $scope.inputMatter ||
        $scope.inputClient ||
        $scope.inputText ||
        _spPageContextInfo.webTitle === 'Matters'
      ) {
        feedvm.filterPane.view.hideFilter = true;
      }

    }

    /**
     * This function populates the PinnedPost variable in Local Storage.
     * @param postObj
     */
    function storePinnedPost(postObj) {

      // If there's no postObj, clear PinnedPost variable in Local Storage
      if (!postObj) {
        common.saveLocal('PinnedPost', {}, 1);
        return;
      }

      // If the postObj is not a Pinned Post, clear PinnedPost variable in Local Storage
      if (!postObj.pinnedpost) {
        common.saveLocal('PinnedPost', {}, 1);
        return;
      }

      // Check if the site of the postObj is the same as current site
      if (postObj.parentwebfullurl == _spPageContextInfo.webAbsoluteUrl) {
        
        // Get Pinned Post from Local Storage. If there is, check if the site
        // of the Pinned Post is the same as the postObj and if the ID is the same.
        // If yes, leave the current Pinned Post.
        var pinnedPost = common.getLocal('PinnedPost');
        if (pinnedPost 
            && pinnedPost.site == postObj.parentwebfullurl
            && pinnedPost.postid == postObj.id) {
          return;
        } else {
          pinnedPost = {'site': postObj.parentwebfullurl, 'postid': postObj.id};
          common.saveLocal('PinnedPost', pinnedPost, 1);
        }
      } else {
        var pinnedPost = {'site': postObj.parentwebfullurl, 'postid': postObj.id};
        common.saveLocal('PinnedPost', pinnedPost, 1);
      }
    }

    init();
  }
})();