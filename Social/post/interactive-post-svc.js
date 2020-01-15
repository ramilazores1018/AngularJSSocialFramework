(function () {
  'use strict';

  reconnectApp
    .factory('postSvc', postSvc);

  postSvc.$inject = ['go', 'pplSvc', '$q', 'timezone', 'common'];

  function postSvc(go, pplSvc, $q, timezone, common) {

    var service = {
      getCommentForSinglePost: getCommentForSinglePost,
      getPostsForShares: getPostsForShares,
      createSharedPost: createSharedPost,
      getCommentCount: getCommentCount,
      getCurrentPost: getCurrentPost,
      setCurrentPost: setCurrentPost,
      getSinglePost: getSinglePost,
      getChildPosts: getChildPosts,
      publishPost: publishPost,
      updateLike: updateLike,
      deletePost: deletePost,
      getUnreadPostsCount_FollowingSites: getUnreadPostsCount_FollowingSites,
      getUnreadPostsCount_FollowingHashtags: getUnreadPostsCount_FollowingHashtags,
      getUnreadPostsCount_FollowingPeople: getUnreadPostsCount_FollowingPeople,
      cacheLatestPost_sitesFollowing: cacheLatestPost_sitesFollowing,
      cacheLatestPost_hashtagsFollowing: cacheLatestPost_hashtagsFollowing,
      cacheLatestPost_peopleFollowing: cacheLatestPost_peopleFollowing,
      overridePinnedPost: overridePinnedPost
    };

    var currentUser;
    var currentPost;
    var hsUrl;

    init();

    return service;

    // ============================================

    function publishPost(postId) {
      var url = _spPageContextInfo.webAbsoluteUrl + '/_api/web/lists/getByTitle(\'Posts\')/items(' + postId + ')';
      var dataObj = {
        '__metadata': {
          'type': 'SP.Data.PostsListItem'
        },
        'Post_x0020_Status': 'Published'
      };

      return go
        .merge(url, dataObj);

    }

    function updateLike(likeType, siteurl, postId, currentLikes) {
      var url = siteurl + '/_api/web/lists/getByTitle(\'Posts\')/items(' + postId + ')';
      var likerId = _spPageContextInfo.userId;

      if (likeType === 'Like') {
        if (currentLikes == null) {
          currentLikes = [Number(likerId)]

        } else {
          currentLikes = currentLikes.split(';');
          currentLikes.push(likerId);

        }

      } else {

        if (currentLikes == null) {
          currentLikes = [Number(_spPageContextInfo.userId)];
        } else {
          currentLikes = currentLikes.split(';');
          currentLikes.forEach(function (liker, i) {
            if (liker == likerId) {
              currentLikes.splice(i, 1);
            }
          });
        }
      }

      var data = {
        '__metadata': {
          'type': 'SP.Data.PostsListItem'
        },
        'LikesId': {
          'results': currentLikes
        }
      };

      return go
        .merge(url, data)
        .then(function (data) {
          return data;
        }, function (err) {
          go.handleError(err);
          return err;
        });

    }

    function getCommentCount(siteUrl, postId) {
      var q = '$select=id&hsf=@relatedpostid=' + postId + ' AND siteurl=' + siteUrl;

      return go
        .getHS('WCComments?' + q)
        .then(function (res) {
          return res.data.d.results.length;
        });
    }

    /**
     * (Private) Used to get post data for shared posts.
     *
     * @param {array} feedDataArr Takes an array of posts as input
     */
    function getPostsForShares(post) {
      var url = hsUrl;

      //console.log('SharedPost Object---------------------------------------');
      //console.log(post);
      //console.log('SharedPost Object---------------------------------------');

        url = "WCPosts?hsf=@(parentwebfullurl='" + post.parentpostsubweb + "')AND(id=" + post.parentpostid + ")&$top=1";

      return go
        .getHS(url)
        .then(function (shareres) {

          return shareres.data.d.results[0];

          // if (data.postcontentowner_display) {
          //   var login = data.sharecontentowner.split('\\')[1];

          //   return pplSvc
          //     .getUserByLogin(login, 'photo,timekeeperid')
          //     .then(function (pplres) {
          //       data.shareowner = pplres.data.d.results[0];

          //       return data;
          //     });
          // } else {
          //   return data;
          // }

        });

    }

    function createSharedPost(sitesShared, postObj) {
      var promises = [];
      // var task = {
      //   'AssignedToId': '',
      //   'TaskDueDate': '',
      //   'Task': '',
      // };

      // var event = {
      //   'Location': '',
      //   'Event_x0020_Start_x0020_Date': '',
      //   'Event_x0020_End_x0020_Date': '',
      //   'isEvent': '',
      // };



      var finalData;
      var data;
      var url;

      sitesShared.forEach(function (site) {
        var postPublished = moment().format();
        url = site.link + '_api/web/lists/getByTitle(\'Posts\')/items';

       
        if (postObj.post.posttype =="Share"){

          data = {
            '__metadata': {
              'type': 'SP.Data.PostsListItem'
            },
            'ParentPostSubweb': postObj.post.shareData.parentwebfullurl,
            'PostContentOwnerId': currentUser.sharepointid,
            'ParentPostID': postObj.post.shareData.id,
            'PostDigest': postObj.message,
            'PostIncludeOnHomepage': true,
            'PinnedPost': false,
            'PostAllowInteractiveFeatures': true,
            'PostStatus': 'Published',
            'PostPublished': postPublished,
            'Tags': postObj.post.tags || postObj.tags,
          };

        }else{

          data = {
            '__metadata': {
              'type': 'SP.Data.PostsListItem'
            },
            'ParentPostSubweb': postObj.post.parentwebfullurl,
            'PostContentOwnerId': currentUser.sharepointid,
            'ParentPostID': postObj.post.id,
            'PostDigest': postObj.message,
            'PostIncludeOnHomepage': true,
            'PinnedPost': false,
            'PostAllowInteractiveFeatures': true,
            'PostStatus': 'Published',
            'PostPublished': postPublished,
            'Tags': postObj.post.tags || postObj.tags,
          };

        }



        // if (postObj.post.task) {
        //   task.AssignedToId = postObj.post.assignedto_id;
        //   // task.TaskDueDate1 = postObj.post.taskduedate; // TODO ADD DATA SERVICE HERE TO FIX
        //   task.TaskDueDate = moment().format();
        //   task.Task = postObj.post.task;

        //   // MERGE TASK AND DATA OBJECT
        //   Object.assign(data, task);
        // }
        // // if (postObj.post.isevent) {
        //   event.Location = postObj.post.location;
        //   event.Event_x0020_Start_x0020_Date = setDateForShare(postObj.post.event_start_date);
        //   event.Event_x0020_End_x0020_Date = setDateForShare(postObj.post.event_end_date);
        //   event.isEvent = postObj.post.isevent;

        //   // MERGE TASK AND DATA OBJECT
        //   Object.assign(data, event);
        // }

        promises.push(go.post(url, data));

      });

      return $q.all(promises);

    }

    function setDateForShare(unixTimestamp) {
      return moment(unixTimestamp).utc().format();
    }

    function deletePost(siteurl, postId) {
      var url = siteurl + '/_api/web/lists/getByTitle(\'Posts\')/items(' + postId + ')';

      return go
        .remove(url)
        .then(
          function (res) {
            return true;
          },
          function (err) {

          }
        );
    }

    function setCurrentPost(postObj) {
      currentPost = postObj;
    }

    function getSinglePost(site, postId) {
      var url = url = "WCPosts?hsf=@siteurl=" + site + "/ AND id=" + postId + "&$top=1";
      return go
        .getHS(url)
        .then(function (res) {
          return res.data.d.results;
        });
    }

    function getChildPosts(site, postId) {
      var url = "WCPosts?hsf=@parentpostsubweb='" + site + "' AND parentpostid=" + postId;
      return go
        .getHS(url)
        .then(function (res) {
          return res.data.d.results;
        });
    }

    function getCommentForSinglePost(siteUrl, postId) {
      var q = 'hsf=@relatedpostid=' + postId + ' AND siteurl=' + siteUrl;

      return go
        .getHS('WCComments?' + q)
        .then(function (res) {
          return res.data.d.results.length;
        });
    }

    function getCurrentPost() {
      return currentPost !== undefined ? currentPost : false;
    }

    function getUnreadPostsCount_FollowingSites() {

      return go
        .getHS("WCPostsFollowing?hsf=@followinguserid=" + _spPageContextInfo.userId)
        .then(function (response) {

          var unreadPostCtr = 0;
          var results = response.data.d.results;
          if (results.length == 0)
            return unreadPostCtr;

          results = common.sortArrayByKey(results, 'created', false);

          var cachedPost = JSON.parse(window.localStorage.getItem('lastReadSitePost'));
          var today = new Date();
          var yesterday = new Date();
          var cachedPostDateMs = yesterday.setDate(today.getDate() - 1);

          if (typeof cachedPost !== 'undefined' && cachedPost != null) {
            var cachedPostDate = cachedPost.created;
            cachedPostDateMs = cachedPostDate.replace("/Date(", '');
            cachedPostDateMs = cachedPostDateMs.replace(")/", '');
          }

          results.forEach(function (element) {

            var tempDate = element.created;
            tempDate = tempDate.replace("/Date(", '');
            tempDate = tempDate.replace(")/", '');

            var dateMs = parseInt(tempDate);

            //Count posts newer than the one stored in browser cache
            if (dateMs > cachedPostDateMs) {
              unreadPostCtr++;
            }
          });

          //resolve(unreadPostCtr);
          return unreadPostCtr;
        });

    }

    function getUnreadPostsCount_FollowingHashtags() {

      return go
        .getHS("WCPostsFollowingHashtags?hsf=@followinguserid=" + _spPageContextInfo.userId)
        .then(function (response) {

          var unreadPostCtr = 0;
          var results = response.data.d.results;
          if (results.length == 0)
            return unreadPostCtr;

          results = common.sortArrayByKey(results, 'created', false);

          var cachedPost = JSON.parse(window.localStorage.getItem('lastReadHashtag'));
          var today = new Date();
          var yesterday = new Date();
          var cachedPostDateMs = yesterday.setDate(today.getDate() - 1);

          if (typeof cachedPost !== 'undefined' && cachedPost != null) {
            var cachedPostDate = cachedPost.created;

            cachedPostDateMs = cachedPostDate.replace("/Date(", '');
            cachedPostDateMs = cachedPostDateMs.replace(")/", '');
          }

          results.forEach(function (element) {

            var tempDate = element.created;
            tempDate = tempDate.replace("/Date(", '');
            tempDate = tempDate.replace(")/", '');

            var dateMs = parseInt(tempDate);

            //Count posts newer than the one stored in browser cache
            if (dateMs > cachedPostDateMs) {
              unreadPostCtr++;
            }
          });

          //resolve(unreadPostCtr);
          return unreadPostCtr;
        });

    }

    function getUnreadPostsCount_FollowingPeople() {

      return go
        .getHS("WCPostsFollowingPeople?hsf=@followinguserid=" + _spPageContextInfo.userId)
        .then(function (response) {

          var unreadPostCtr = 0;
          var results = response.data.d.results;
          if (results.length == 0)
            return unreadPostCtr;

          results = common.sortArrayByKey(results, 'created', false);

          if (results.length == 0)
            return;

          var cachedPost = JSON.parse(window.localStorage.getItem('lastReadPeoplePost'));
          var today = new Date();
          var yesterday = new Date();
          var cachedPostDateMs = yesterday.setDate(today.getDate() - 1);

          if (typeof cachedPost !== 'undefined' && cachedPost != null) {
            var cachedPostDate = cachedPost.created;

            cachedPostDateMs = cachedPostDate.replace("/Date(", '');
            cachedPostDateMs = cachedPostDateMs.replace(")/", '');
          }

          var unreadPostCtr = 0;
          results.forEach(function (element) {

            var tempDate = element.created;
            tempDate = tempDate.replace("/Date(", '');
            tempDate = tempDate.replace(")/", '');

            var dateMs = parseInt(tempDate);

            //Count posts newer than the one stored in browser cache
            if (dateMs > cachedPostDateMs) {
              unreadPostCtr++;
            }
          });

          return unreadPostCtr;
        });

    }

    function cacheLatestPost_sitesFollowing() {

      var cachedPost = window.localStorage.getItem('lastReadPost');
      if (typeof cachedPost !== 'undefined' && cachedPost != null) {
        return cachedPost;
      }

      return go
        .getHS("WCPostsFollowing?hsf=@followinguserid=" + _spPageContextInfo.userId)
        .then(function (response) {
          var results = response.data.d.results;
          results = common.sortArrayByKey(results, 'created', false);

          if (results.length == 0) return;

          //Only get the last post among all the people you're following
          var lastElement = results[0];

          //Set it to cache
          window.localStorage.setItem('lastReadSitePost', JSON.stringify(lastElement));
          return JSON.stringify(lastElement);
        });
    }

    function cacheLatestPost_hashtagsFollowing() {

      var cachedPost = window.localStorage.getItem('lastReadSitePost');
      if (typeof cachedPost !== 'undefined' && cachedPost != null) {
        return cachedPost;
      }

      return go
        .getHS("WCPostsFollowingHashtags?hsf=@followinguserid=" + _spPageContextInfo.userId)
        .then(function (response) {
          var results = response.data.d.results;
          results = common.sortArrayByKey(results, 'created', false);

          if (results.length == 0) return;

          //Only get the last post among all the people you're following
          var lastElement = results[0];

          //Set it to cache
          window.localStorage.setItem('lastReadHashtag', JSON.stringify(lastElement));
          return JSON.stringify(lastElement);
        });
    }

    function cacheLatestPost_peopleFollowing() {

      var cachedPost = window.localStorage.getItem('lastReadPeoplePost');
      if (typeof cachedPost !== 'undefined' && cachedPost != null) {
        return cachedPost;
      }

      return go
        .getHS("WCPostsFollowingPeople?hsf=@followinguserid=" + _spPageContextInfo.userId)
        .then(function (response) {
          var results = response.data.d.results;
          results = common.sortArrayByKey(results, 'created', false);

          if (results.length == 0) return;

          //Only get the last post among all the people you're following
          var lastElement = results[0];

          //Set it to cache
          window.localStorage.setItem('lastReadPeoplePost', JSON.stringify(lastElement));
          return JSON.stringify(lastElement);
        });
    }

    function overridePinnedPost() {
      
      var domain = _spPageContextInfo.webAbsoluteUrl;
      var pinnedPost = common.getLocal("PinnedPost");

      if (pinnedPost && Object.keys(pinnedPost).length <= 0) return;

      var postInfo = {};
      postInfo.PinnedPost = 'false';
      postInfo.__metadata = {
        'type': 'SP.Data.PostsListItem'
      };

      go.merge(
          domain + '/_api/web/lists/getByTitle(\'Posts\')/items(' + pinnedPost.postid + ')',
          postInfo
        )
        .then(function goPutSuccess(response) {
          if (response) {
            // Do nothing
          } else { }
        })
        .catch(function goPutFail(err) {
          // Do nothing
        });
    }

    function init() {
      hsUrl = go.detectHSEnv();
      pplSvc
        .getCurrentUser(_spPageContextInfo.userId)
        .then(function (res) {
          currentUser = res;
        });
    }
  }

})();