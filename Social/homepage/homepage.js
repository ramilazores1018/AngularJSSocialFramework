(function () {
  'use strict';

  reconnectApp
    .directive('homepageFeed', homepage)
    .controller('homepageCtrl', homepageCtrl);


  function homepage() {
    var directive = {
      templateUrl: "/_layouts/15/Connect/templates/homepage/homepage.html",
      controller: homepageCtrl,
      controllerAs: 'homevm',
      restrict: 'AE',
      scope: {},
    };

    return directive;
  }

  homepageCtrl.$inject = ["postSvc", "$q"];

  function homepageCtrl(postSvc, $q) {
    var homevm = this;

    homevm.loadTab = loadTab;
    homevm.showPeopleTab = false;
    homevm.showTagsTab = false;

    homevm.showSitesFollowing = true;
    homevm.showTagsFollowing = false;
    homevm.showPeopleFollowing = false;

    /**
     * Data Stores
     */
    // homevm.counter = new Object();
    // homevm.counter.unreadPosts_Sites = 0;
    // homevm.counter.unreadPosts_People = 0;
    // homevm.counter.unreadPosts_Hashtags = 0;    

    /**
     * Loading flags
     */
    // homevm.counter.unreadPosts_SitesFlag = false;
    // homevm.counter.unreadPosts_PeopleFlag = false;
    // homevm.counter.unreadPosts_HashtagFlag = false;

    /**
     *  Functions Declarations 
     */
    // homevm.getUnreadPosts_SitesFollowing = getUnreadPosts_SitesFollowing;
    // homevm.getUnreadPosts_HashtagsFollowing = getUnreadPosts_HashtagsFollowing;
    // homevm.getUnreadPosts_PeopleFollowing = getUnreadPosts_PeopleFollowing;
    // homevm.cacheLatestPost_sitesFollowing = cacheLatestPost_sitesFollowing;
    // homevm.cacheLatestPost_hashtagsFollowing = cacheLatestPost_hashtagsFollowing;
    // homevm.cacheLatestPost_peopleFollowing = cacheLatestPost_peopleFollowing;

    function loadTab(tabName) {
      switch (tabName) {
        case 'sitesFollowing':
          homevm.showSitesFollowing = true;
          homevm.showTagsFollowing = false;
          homevm.showPeopleFollowing = false;
          break;
        case 'tagsFollowing':
          homevm.showSitesFollowing = false;
          homevm.showTagsFollowing = true;
          homevm.showPeopleFollowing = false;
          break;
        case 'peopleFollowing':
          homevm.showSitesFollowing = false;
          homevm.showTagsFollowing = false;
          homevm.showPeopleFollowing = true;
          break;

        default:
          break;
      }
    }

    /**
     *  Function Definitions
     */
    function getUnreadPosts_SitesFollowing() {

      postSvc
        .getUnreadPostsCount_FollowingSites()
        .then(function (response) {
          homevm.counter.unreadPosts_Sites = response;
          homevm.counter.unreadPosts_SitesFlag = true;
        });
    }

    function getUnreadPosts_HashtagsFollowing() {

      postSvc
        .getUnreadPostsCount_FollowingHashtags()
        .then(function (response) {
          homevm.counter.unreadPosts_Hashtags = response;
          homevm.counter.unreadPosts_HashtagsFlag = true;
        });
    }

    function getUnreadPosts_PeopleFollowing() {

      return postSvc
        .getUnreadPostsCount_FollowingPeople()
        .then(function (response) {
          homevm.counter.unreadPosts_People = response;
          homevm.counter.unreadPosts_PeopleFlag = true;
        });
    }

    function cacheLatestPost_sitesFollowing() {

      return postSvc
        .cacheLatestPost_sitesFollowing()
        .then(function (response) {

          homevm.counter.unreadPosts_Sites = 0;
        });
    }

    function cacheLatestPost_hashtagsFollowing() {

      return postSvc
        .cacheLatestPost_hashtagsFollowing()
        .then(function (response) {
          homevm.counter.unreadPosts_Hashtags = 0;
        });
    }

    function cacheLatestPost_peopleFollowing() {

      return postSvc
        .cacheLatestPost_peopleFollowing()
        .then(function (response) {
          homevm.counter.unreadPosts_People = 0;
        });
    }

    /**
     * Initialization
     */
    function init() {
      // getUnreadPosts_SitesFollowing();
      // getUnreadPosts_HashtagsFollowing();
      // getUnreadPosts_PeopleFollowing();
    }

    init();

  }


}());