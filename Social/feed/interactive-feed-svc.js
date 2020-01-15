(function () {

  "use strict";

  reconnectApp
    .factory("feedSvc", feedSvc);

  feedSvc.$inject = ["go", "$q"];

  // SERVICE
  function feedSvc(go, $q) {
    var $select =
      "$select=assignedto,assignedto_displayname,assignedto_id,assignedto_link," +
      "assignedto_networklogin,assignedto_photo,contenttype,datecompleted,embed_media," +
      "event_end_date,event_start_date,id,isEvent,isKeyDate,key_contacts,key_contacts_displayname,key_contacts_id," +
      "likes,likes_displayname,likes_id,listid,location,mentions,mentions_displayname,mentions_id," +
      "parentlistid,parentpostid,parentpostsubweb,parentpostsubwebtitle,parentwebfullurl," +
      "parentwebid,parentwebtitle,parentweburl,post_categories," +
      "post_firmwide,post_status,postallowinteractivefeat,postcategories,postcontentowner," +
      "postcontentowner_display,postcontentowner_id,postcontentowner_link,postcontentowner_photo,postdigest," +
      "postembedcode,postincludeonhomepage,postiscopy,postkeycontacts,postopennewwindow,postpublished,poststatus," +
      "posttype,read_more_link,redirect_url,sitetitle,siteurl,tags,task,taskduedate,taskstatus,postbody," +
      "title,currentusercontentteam,currentusersubscribed,keypost" +
      ",site_editors_id,site_manager_id,site_owner_id" + // Used for determining Edit and Delete access to posts
      ",postupdatedby,postupdatedby_id,postupdatedby_displaynam,postupdateddate,ispostupdatedbyothers" + // Used in Post History
      ",client,matter" + // Used by Matters
      ",createdby_displayname,createdby,createdbyid" // REQUIRED FOR WHEN CONTENT OWNER IS EMPTY. THIS IS A FALLBACK
      + ",pinnedpost"; // Added Pinned Post functionality

       var $peopleSelect =
       "$select=assignedto,assignedto_displayname,assignedto_id,assignedto_link," +
       "assignedto_networklogin,assignedto_photo,contenttype,datecompleted,embed_media," +
       "event_end_date,event_start_date,id,isEvent,isKeyDate,key_contacts,key_contacts_displayname,key_contacts_id," +
       "likes,likes_displayname,likes_id,listid,location,mentions,mentions_displayname,mentions_id," +
       "parentlistid,parentpostid,parentpostsubweb,parentpostsubwebtitle,parentwebfullurl," +
       "parentwebid,parentwebtitle,parentweburl,post_categories," +
       "post_firmwide,post_status,postallowinteractivefeat,postcategories,postcontentowner," +
       "postcontentowner_display,postcontentowner_id,postcontentowner_link,postcontentowner_photo,postdigest," +
       "postembedcode,postincludeonhomepage,postiscopy,postkeycontacts,postopennewwindow,postpublished,poststatus," +
       "posttype,read_more_link,redirect_url,sitetitle,siteurl,tags,task,taskduedate,taskstatus,postbody," +
       "title,currentusercontentteam,currentusersubscribed,createdbyid,keypost" +
       ",site_editors_id,site_manager_id,site_owner_id" +// Used for determining Edit and Delete access to posts
       ",__RoleAssignmentsID,roleassignmentid"; // Need these 2 fields in order to speed up results for WCPostsFollowingPeople.
 
       /* Removed on 7/3/2019 in order to get WCPostsFollowingHashtags and People working 
        "reminderstart,sendreminder,percentcomplete,post_categories_formatted" */

    var categories;
    var hashtags;
    var hsUrl;

    var service = {
      getCategoriesForSite: getCategoriesForSite,
      // unfollowHashtag: unfollowHashtag,
      getFollowedTags: getFollowedTags,
      // getTagsForSite: getTagsForSite,
      // followHashtag: followHashtag,
      // getSiteManager: getSiteManager,
      // getSiteOwner: getSiteOwner,
      // getSiteEditors: getSiteEditors,
      // getAllWithEditAccess: getAllWithEditAccess,
      getSinglePost: getSinglePost,
      categories: categories,
      hashtags: hashtags,
      getFeed: getFeed,
      $select: $select,
      $peopleSelect: $peopleSelect
    };

    init();

    return service;

    //  ==============================================================================

    /**
     * Used to get the feed data.
     *
     * @param {object} feedObj Taske the feed object as input.
     */
    function getFeed(feedUrl) {

      return go
        .getHS(feedUrl)
        .then(
          function (res) {
            if (!res) return [];
            if (res.data.hasOwnProperty('error')) return [];
            return res.data.d.results;
          });

    }

    // function getSiteManager() {

    // }

    // function getSiteOwner() {

    // }

    // function getSiteEditors() {

    // }

    // function getSiteId() {
    //   return go.get(_spPageContextInfo.webAbsoluteUrl + "/_api/web/id");
    // }

    // function getAllWithEditAccess() {

    //   //   if (common.getLocal('WCAllSites') && !force) {
    //   //     return $q.resolve(common.getLocal('WCAllSites'));
    //   // }
    //   var arr = [];

    //   // var url = 'WCSites?$select=site_manager_id,site_owner_id,site_editors_id' + "&hsf=@SiteID=" // + filter
    //   return getSiteId()
    //     .then(function siteIdSuccess(siteId) {
    //       return go.getHS(url + siteId.data.d.Id);
    //     }).then(function gotYourEditors(res) {
    //       var editors = res.data.d.results;

    //       if (editors.length > 0) {
    //         if (editors[0].site_editors_id != null) {
    //           extractIds(editors[0].site_editors_id);
    //         }
    //         if (editors[0].site_manager_id != null) {
    //           extractIds(editors[0].site_manager_id);
    //         }
    //         if (editors[0].site_owner_id != null) {
    //           extractIds(editors[0].site_owner_id);
    //         }
    //       }

    //       // CACHE FRESH DATA TO LOCAL STORAGE
    //       // common.saveLocal('WCAllSites', arr, 48);
    //       return arr;
    //     });

    //     function extractIds(editors) {
    //       if (editors != null) {
    //         if (editors.indexOf(";") >= 0) {
    //           editors = editors.split(";");
    //           editors.forEach(function (id, idx, arry) {
    //             arr.push(id);
    //           })
    //         }else{
    //           // One ID
    //           arr.push(editors);
    //         }
    //       } else {
    //         return ;
    //       }
    //     }

    // }

    function getSinglePost(postId, customSelect) {
      
      if (customSelect) { $select = customSelect; }
      
      var uniqueToken = moment().format('mmssSS');
      var feedUrl = 'WCPosts?' + $select + '&hsr=' + uniqueToken + '&$top=1&hsf=@id=' + postId + " AND siteurl='" + _spPageContextInfo.webAbsoluteUrl + "/'";

      return go
        .getHS(feedUrl)
        .then(
          function (res) {
            if (!res) return [];
            if (res.data.hasOwnProperty('error')) return [];
            return res.data.d.results;
          });

    }

    function getCategoriesForSite(site) {
      return go
        .getHS('WCCategoriesBySite?$select=title,id&hsf=@site="' + site + '"')
        .then(function (res) {
          var arr = [];

          res.data.d.results.forEach(function (item) {
            arr.push({
              name: item.title,
              id: item.id
            });
          });

          return arr;
        });
    }

    function getFollowedTags() {
      return go
        .getHS('WCFollowing?$select=linktitle,follow_type,id&hsf=@follow_type="Tag" AND __createdby_id=' + _spPageContextInfo.userId)
        .then(function (res) {
          window.localStorage.setItem('WCFollowing', JSON.stringify(res.data.d.results));
          return res.data.d.results;
        });
    }

    // function getTagsForSite() {
    //   return go
    //     .getHS('WCHashtags?$select=title')
    //     .then(function (res) {
    //       var arr = [];
    //       var id = 0;

    //       res.data.d.results.forEach(function (item) {
    //         arr.push({
    //           name: item.title,
    //           id: id
    //         });

    //         id++;

    //       });

    //       return arr;
    //     });
    // }

    function init() {
      hsUrl = go.detectHSEnv();
      getFollowedTags();
    }
  }

})();