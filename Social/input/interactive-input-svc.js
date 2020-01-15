(function () {
  'use strict';

  reconnectApp
    .factory('interactiveInputSvc', interactiveInputSvc);

  interactiveInputSvc.$inject = ['$q', 'go', 'socialDataSvc', 'common', 'feedSvc', 'timezone'];

  function interactiveInputSvc($q, go, socialDataSvc, common, feedSvc, timezone) {

    var tags = [];
    var tagsBySite = [];
    var handshakeUrl;
    var hsToSp = {}; // Global variable
    var allMethods = {
      // addMultipleRedDotAlert: addMultipleRedDotAlert,
      addHashTag: addHashTag,
      addMultipleHastag: addMultipleHastag,
      addPostCategory: addPostCategory,
      addSubscriber: addSubscriber,
      addMultipleSubscriber: addMultipleSubscriber,
      // addRedDotAlert: addRedDotAlert,
      checkSubscriber: checkSubscriber,
      checkHashTags: checkHashTags,
      checkCategory: checkCategory,
      deletePost: deletePost,
      getAssignedTo: getAssignedTo,
      getFollowedMatters: getFollowedMatters,
      getKeyContacts: getKeyContacts,
      getContentOwner: getContentOwner,
      getCategories: getCategories,
      getPost: getPost,
      newMagicSuggest: newMagicSuggest,
      savePost: savePost,
      showProcessTime: showProcessTime,
      setMagicSuggestUsers: setMagicSuggestUsers,
      updatePost: updatePost,      
      getPinPostAccess: getPinPostAccess
    };

    /**
     *  SavePOst Method
     *   This takes an object as an argument.
     * postInfo {obj} post object being sent to SharePoint
     * isDraft {bool} mark true if saving as draft
     * type {string} this identifies post type (Micro,Event,Task, etc)
     * @param {*} postObj post object being sent to SharePoint
     * @param {*} siteUrl
     * @returns
     */
    function savePost(postObj, siteUrl) {
      var isHomePage = _spPageContextInfo.webServerRelativeUrl === '/';
      var domain =  _spPageContextInfo.webAbsoluteUrl;
      if (isHomePage && domain.lastIndexOf("/") == domain.length-1) {
        domain = siteUrl.substr(0, siteUrl.length - 1);
      }

      var url = domain + '/_api/web/lists/getByTitle(\'Posts\')/items';
      var postInfo = postObj.postData;
      // var isDraft = postObj.isDraft;
      // var postType = postObj.type;
      var deferred = $q.defer();

      postInfo.__metadata = {
        'type': 'SP.Data.PostsListItem'
      };

      return go
        .post(
          url,
          postInfo
        )
        .then(function goPostSuccess(res) {
          if (res) {
            var id = res.data.d.Id;
            var posterId = res.data.d.AuthorId;
            if (res.data != "undefined") {
              var uniqueUrl = _spPageContextInfo.webAbsoluteUrl + '-Posts-' + id + '-' + posterId;
            }
            deferred.resolve({
              item: res.data.d,
              status: 'success',
              errmessage: null
            });

            return res;

          } else {
            go.handleError({
              MethodName: "savePost"
            }, url);
          }
        })
        .catch(function goPostFail(error) {
          go.handleError(error);
          deferred.reject(error);
        });
      // }
    }

    /**
     * getFollowedMatters
     * This function is a copy from matter_data.service.js from Matters project.
        At the time of implementation, ngMatters wasn't part of prod's Angular module.
        In the future, this should be removed and use the function from Matters instead.
     * @returns
     */
    function getFollowedMatters() {
      var hsf = 'hsf=@follow_user_id=' + _spPageContextInfo.userId + ' and follow_type=Matter&';
      var select = '$select=client,matter,title,link&';
      var top = '$top=50&';
      return go
        .getHS('WCFollowing?' + select + hsf + top)
        .then(function (res) {
          // matterCache[mat_id].followedMatters = res.data.d.results;
          return res.data.d.results;
        });
    }

    function clearOldBodyField() {

    }

    /**
     *
     *
     * @param {object} postObj  postObj - Properties/fields to update in SharePoint format
     * @param {object} originalPostObj  originalPostObj - is a copy of the post object passed to update, likely in Handshake format
     * @param {number} pID  pID - ID of the post to update
     * @param {string} siteUrl
     * @returns
     */
    function updatePost(postObj, originalPostObj, pID, siteUrl) {
      var postInfo = {}; // Data object used to save post
      var deferred = $q.defer();
      var isHomePage = _spPageContextInfo.webServerRelativeUrl === '/';
      var domain = isHomePage ? siteUrl.substr(0, siteUrl.length - 1) : _spPageContextInfo.webAbsoluteUrl;
      var valueOfPostObj = "";
      var resetPostBody = false;
      var appendBodyToDigest = false;

      if (originalPostObj) {
        // Loop through all keys
        Object.keys(originalPostObj).map(function (originalKey, idx) {
          var spKey = hsToSp[originalKey];

          if (originalPostObj.hasOwnProperty(originalKey) && postObj.hasOwnProperty(spKey)) {
            // key exists in postobj
            var originalPostValue = originalPostObj[originalKey];
            valueOfPostObj = postObj[spKey];
            if (typeof originalPostValue == "string") {
              if (originalPostValue.indexOf("/Date(") == 0) {
                originalPostValue = timezone.getFormattedDateTime(originalPostValue, true)
              }
            }

            if (typeof valueOfPostObj == "string" && valueOfPostObj.indexOf("%3Cdiv") == 0) {
              // Digest is encdoded. Need to decode to run a fair comparison. 
              valueOfPostObj = common.decodeHTML(valueOfPostObj);
            }
            if (originalPostValue != valueOfPostObj) {
              // Values don't match, something changed
              // save the key/value pair
              postInfo[spKey] = postObj[spKey];
            }
          }

          // Special Case for Hashtags. This now handles when hashtags have been removed.
          if (originalKey == "tags") {
            var originalPostValue = originalPostObj[originalKey];
            valueOfPostObj = postObj[spKey];
            valueOfPostObj = (!valueOfPostObj) ? '' : valueOfPostObj;

            if (originalPostValue != valueOfPostObj) {
              // Values don't match, something changed
              // save the key/value pair
              postInfo[spKey] = valueOfPostObj;
            }
          }

        });

        if (originalPostObj["postbody"] != "" || originalPostObj["postbody"] != null) {
          // This is an old post with a postbody
          var postBody = originalPostObj["postbody"];
          var postDigest = originalPostObj["postdigest"];

          // Need to appeend post body to post digest.
          // Then empty PostBody from postInfo.
          resetPostBody = true;
          (postDigest && postDigest.indexOf(postBody) < 0) ? appendBodyToDigest = true : null;
          // digest is empty but we have a body, set appendBodyToDigest to true
          (!postDigest) ? appendBodyToDigest = true : null;
        }
        (resetPostBody) ? postInfo["PostBody"] = "" : null;
        (appendBodyToDigest) ? postInfo["PostDigest"] + postInfo["PostBody"] : null;
      }

      postInfo.__metadata = {
        'type': 'SP.Data.PostsListItem'
      };

      go
        .merge(
          domain + '/_api/web/lists/getByTitle(\'Posts\')/items(' + pID + ')',
          postInfo
        )
        .then(function goPutSuccess(response) {
          if (response) {
            deferred.resolve({
              item: response,
              status: 'success',
              errmessage: null
            });

            return response;
          } else { }
        })
        .catch(function goPutFail(err) {
          deferred.reject({
            item: null,
            status: "error",
            errmessage: JSON.stringify(err)
          });
        });

      return deferred.promise;
    }

    function deletePost(siteurl, postId) {
      var url = siteurl + '/_api/web/lists/getByTitle(\'Posts\')/items(' + postId + ')';

      return go
        .remove(url)
        .then(
          function (res) {
            return true;
          },
          function (err) { }
        );
    }

    function getPost(pID) {
      return feedSvc.getSinglePost(pID);
    }

    function getKeyContacts(contacts) {
      var ContactIDs = [];
      $.each(contacts, function (i, value) {
        if (value.name !== undefined) {
          ContactIDs.push(value.sharepointid);
        }
      });
      return {
        'results': ContactIDs
      };
    }

    function setMagicSuggestUsers(users) {
      var oUsers = [];
      $.each(users.results, function (i, val) {
        if (val.Name !== undefined) {
          oUsers.push({
            name: val.Title,
            networklogin: "wcnet\\" + val.UserName,
            sharepointid: val.Id
          });
        }
      });
      return oUsers;
    }

    function getAssignedTo(assignedto) {

      return assignedto[0].sharepointid;
    }

    function getContentOwner(owner) {
      // Assuming first person in the array
      if (common.isArray(owner)) {
        return owner[0].sharepointid;
      } else if (typeof owner == "number") {
        // Likely a  single number was passed in as the owner. 
        return owner;
      } else {
        throw new error("Array required to getContentOwner", {
          "function": "getContentOwner",
          "file": "interactive-input-svc.js",
          "line": 163
        });
      }

    }

    /**
     * Get Categories
     *
     * This method gets all Categories
     *
     */
    function getCategories(url) {
      // var deferred = $q.defer();

      url = url || _spPageContextInfo.webServerRelativeUrl
      return socialDataSvc
        .getSiteCategories(url)
        .then(function (res) {
          return res;
        });

      // go.get(searchURL)
      //   .then(function goGetSuccess(data) {
      //     var categoryArr = [];
      //     var results;
      //     if (typeof data.d === "undefined") {
      //       results = data;
      //     } else {
      //       results = data.d.results;
      //     }
      //     results.forEach(function (category, i) {
      //       categoryArr.push({
      //         id: i,
      //         name: category.title
      //       });
      //     });

      //     deferred.resolve(categoryArr);
      //     wc.log('Category retrieved.');

      //   }).catch(function goGetFail(err) {
      //     deferred.reject(false);
      //     wc.error('Category retrieving Failed' + JSON.stringify(err), {
      //       fileName: 'interactive-postform.js',
      //       methodName: 'getCategories'
      //     });

      //   });

    }

    function setupMS(o) {
      var magicObject = {};
      if (o.data && o.data.length > 0) {
        var valueField = (o.data[0].hasOwnProperty('sharepointid')) ? 'sharepointid' : 'id';
      } else {
        var valueField = {};
      }

      magicObject = {
        data: o.data,
        displayField: 'name',
        placeholder: o.placeholder || '',
        sortOrder: 'name',
        valueField: valueField
      }
      magicObject = common.appendOptions(magicObject, o);
      return angular.element(o.id).magicSuggest(magicObject);
    }

    function newMagicSuggest(o) {
      return $q(function (resolve, reject) {
        try {
          var data = o.data;
          if (data == false || data == "") return reject(o);
          var ms = setupMS(o);
          return resolve(ms);
          // }
        } catch (error) {
          go.handleError(error);
          reject(error);
        }
      })
    }

    function getTags() {
      go.get({
        url: handshakeUrl + '/WCHashtags',
        jsonp: true
      })
        .then(function (data) {
          var tagsArr = data.d.results;

          tagsArr.forEach(function (tag) {
            tags.push(tag.title);
          });

        });

    }

    function getTagsBySite() {

      go.get({
        url: handshakeUrl + '/WCHashtagsBySite?hsf=@siteurl=' + _spPageContextInfo.webAbsoluteUrl + "/",
        jsonp: true

      })
        .then(function (data) {
          var tagsArr = data.d.results;

          tagsArr.forEach(function (tag) {
            tagsBySite.push(tag.tag);
          });

        });

    }

    /**
     *=============================================================================================================
     * this will return a promise for successfully added subscriber item ID
     *=============================================================================================================
     */
    function addSubscriber(strLogin, strAction, strUserID, intLatestItemID) {

      var deferred = $q.defer();
      var strTitle = _spPageContextInfo.webAbsoluteUrl + "-Posts-" + intLatestItemID.toString() + "-" + strUserID;

      checkSubscriber(strTitle, strUserID, strAction)
        .then(function (result) {

          if (result == false) {

            go.get(_spPageContextInfo.siteAbsoluteUrl + "/_api/web/siteusers(@v)?@v='" + encodeURIComponent("i:0#.w|" + strLogin) + "'")
              .then(function (data) {

                var dataObj = {
                  '__metadata': {
                    'type': 'SP.Data.SubscribersListItem'
                  },
                  'Title': strTitle,
                  'Action': strAction,
                  'UserId': strUserID,
                  'SubscriberId': data.data.d.Id,
                  'ReConnUrl': _spPageContextInfo.webAbsoluteUrl,
                  'ListName': "Posts",
                  'ItemId': intLatestItemID.toString()

                };

                go.post(
                  _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Subscribers')/items",
                  dataObj
                )
                  .then(function goPostSuccess(data) {

                    deferred.resolve(data.data.d.Id.toString());
                    //wc.log('Subscriber Created');

                  }).catch(function goPostFail(err) {

                    deferred.reject(err.responseJSON.error.code);
                    // wc.error('Subscriber adding Failed' + JSON.stringify(err), {
                    //   fileName: 'interactive-postform.js',
                    //   methodName: 'addSubscriber'
                    // });

                  });

              });

            if (strAction == 'Mention' || strAction == 'Content Owner') {
              addRedDotAlert(strLogin, intLatestItemID, "Post");
            } else {
              addRedDotAlert(strLogin, intLatestItemID, "Task");
            }

          }

        });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * this will return a promise(array[]) for successfully added subscriber item IDs
     *=============================================================================================================
     */

    function addMultipleSubscriber(oSubscriber, intLatestItemID) {

      var promises = [];
      var deferred = $q.defer();

      $.each(oSubscriber, function (i, value) {
        promises.push(addSubscriber(value.login, value.action, value.userId, intLatestItemID));
      });

      $q.all(promises).then(function (result) {

        deferred.resolve(result);

      }, function (error) {

        deferred.reject(error);

      });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * this will return a promise(boolean) value if the subscriber exist or not in the subscriber list
     *=============================================================================================================
     */

    function checkSubscriber(strTitle, strUserID, strAction) {

      var deferred = $q.defer();
      var searchURL = _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Subscribers')/items?$select=ID&$filter=((Title eq '" + strTitle + "' and UserId eq '" + strUserID + "') and Action eq '" + strAction + "')";

      go.get(searchURL)
        .then(function goGetSuccess(data) {

          if (data.data.d.results.length <= 0) {

            deferred.resolve(false);
            //wc.log('Subscriber not found');

          } else {

            deferred.resolve(true);
            //wc.log('Subscriber found');
          }

        }).catch(function goGetFail(err) {

          deferred.reject(false);
          // wc.error('Subscriber checking Failed' + JSON.stringify(err), {
          //   fileName: 'interactive-postform.js',
          //   methodName: 'checkSubscriber'
          // });

        });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * this will return a promise for successfully added red dot alert item ID
     * this function is used to trigger the notification email sent to subscriber  for comments, mentions and as a content owner
     *=============================================================================================================
     */
    function addRedDotAlert(strLogin, intLatestItemID, strAlertType) {

      var strAlertMessage = "";
      var deferred = $q.defer();

      if (strAlertType == 'Post') strAlertMessage = "mentioned you in the post.";
      if (strAlertType == 'Task') strAlertMessage = "assigned you a task.";
      if (strAlertType == 'Event') strAlertMessage = "mentioned you in an Event.";

      go.get(_spPageContextInfo.siteAbsoluteUrl + "/_api/web/siteusers(@v)?@v='" + encodeURIComponent("i:0#.w|" + strLogin) + "'")
        .then(function (data) {

          var dataObj = {
            '__metadata': {
              'type': 'SP.Data.AlertsListItem'
            },
            'Title': wc.currentUser.Name + " " + strAlertMessage, //need to check this in the wc object
            'Icon': "fa-info-circle",
            'UserId': data.data.d.Id,
            'Link': _spPageContextInfo.webAbsoluteUrl + '/pages/post.aspx?pID=' + intLatestItemID.toString(),
            'AlertType': strAlertType,
            'Image': wc.currentUser.peoplePhotoSmall

          };

          go.post(
            _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Alerts')/items",
            dataObj
          )
            .then(function goPostSuccess(data) {

              deferred.resolve(data.data.d.Id.toString());
              wc.log('Alert Created');

            }).catch(function goPostFail(err) {

              deferred.reject(err.responseJSON.error.code);
              wc.error('Alert adding Failed' + JSON.stringify(err), {
                fileName: 'interactive-postform.js',
                methodName: 'addRedDotAlert'
              });

            });

        });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * this will return a promise(array[]) for successfully added red dot alert item IDs
     * this function is used to trigger the notification email sent to subscriber  for comments, mentions and as a content owner
     *=============================================================================================================
     */
    // function addMultipleRedDotAlert(oAlerts, intLatestItemID, strAlertType) {
    //   var promises = [];
    //   var deferred = $q.defer();
    //   $.each(oAlerts, function (i, value) {
    //     promises.push(addRedDotAlert(value.login, intLatestItemID, strAlertType));
    //   });
    //   $q.all(promises).then(function (result) {
    //     deferred.resolve(result);
    //   }, function (error) {
    //     deferred.reject(error);
    //   });
    //   return deferred.promise;
    // }

    /**
     *=============================================================================================================
     * this will return a promise for successfully added hashtag item ID
     *=============================================================================================================
     */
    function addHashTag(strHashTag) {

      var deferred = $q.defer();

      var dataObj = {
        '__metadata': {
          'type': 'SP.Data.HashtagsListItem'
        },
        'Title': strHashTag
      };

      checkHashTags(strHashTag)
        .then(function (result) {

          if (result == false) {

            go.post(
              _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Hashtags')/items",
              dataObj
            )
              .then(function goPostSuccess(data) {

                deferred.resolve(data.data.d.Id.toString());
                //wc.log('Hashtag Created');

                tags = [];
                getTags();

              }).catch(function goPostFail(err) {

                deferred.reject(err.responseJSON.error.code);
                // wc.error('Hashtag adding Failed' + JSON.stringify(err), {
                //   fileName: 'interactive-postform.js',
                //   methodName: 'addHastag'
                // });

              });

          }

        });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * return a promise(array[]) of successfully added hashtag item IDs
     *=============================================================================================================
     */
    function addMultipleHastag(oHashTags) {

      var promises = [];
      var deferred = $q.defer();

      $.each(oHashTags, function (i, value) {
        promises.push(addHashTag(value));
      });

      $q.all(promises).then(function (result) {

        deferred.resolve(result);

      }, function (error) {

        deferred.reject(error);

      });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * return a promise(boolean) value if the hashtag exist or not in the hashtag list
     *=============================================================================================================
     */
    function checkHashTags(strTitle) {
      var deferred = $q.defer();
      var searchURL = _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Hashtags')/items?$select=ID&$filter=Title%20eq%20%27%23" + strTitle.replace('#', '') + "%27";
      go.get(searchURL)
        .then(function goGetSuccess(data) {
          if (data.d.results.length <= 0) {
            deferred.resolve(false);
          } else {
            deferred.resolve(true);
          }
        }).catch(function goGetFail(err) {
          deferred.reject(false);
        });
      return deferred.promise;
    }

    /**
     *=============================================================================================================
     * return a promise for successfully added category item ID
     *=============================================================================================================
     */
    function addPostCategory(strTitle, intOrder, strUnique) {

      var deferred = $q.defer();

      var dataObj = {
        '__metadata': {
          'type': 'SP.Data.Post_x0020_CategoriesListItem'
        },
        'Title': strTitle,
        'Site': _spPageContextInfo.webServerRelativeUrl,
        'Order0': intOrder,
        'unique': strUnique
      };

      go.post(
        _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Post Categories')/items",
        dataObj
      )
        .then(function goPostSuccess(data) {

          deferred.resolve(data.d.Id.toString());
          wc.log('Post Category Created');

        }).catch(function goPostFail(err) {

          deferred.reject(err.responseJSON.error.code);
          // wc.error('Post Category adding Failed' + JSON.stringify(err), {
          //   fileName: 'interactive-postform.js',
          //   methodName: 'addPostCategory'
          // });

        });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * return a promise(boolean) value if the category exist or not in the category list
     *=============================================================================================================
     */
    function checkCategory(strTitle) {

      var deferred = $q.defer();
      var searchURL = _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getbytitle('Post Categories')/items?$select=ID&$filter=Title eq '" + strTitle + "'";

      go.get(searchURL)
        .then(function goGetSuccess(data) {

          if (data.d.results.length <= 0) {

            deferred.resolve(false);
            //wc.log('Category not found');

          } else {

            deferred.resolve(true);
            //wc.log('Category found');
          }

        }).catch(function goGetFail(err) {

          deferred.reject(false);
          // wc.error('Category checking Failed' + JSON.stringify(err), {
          //   fileName: 'interactive-postform.js',
          //   methodName: 'checkCategory'
          // });

        });

      return deferred.promise;

    }

    /**
     *=============================================================================================================
     * use to log processing time..
     *=============================================================================================================
     */
    function showProcessTime(strProcessName) {
      var dt = new Date();
      var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();

    }

        
    /**
     * =========================================================
     * This function returns true of the current user has
     * Site Editor, Site Manager or Site Owners access to the
     * current site.
     * =========================================================
     */
    function getPinPostAccess() {

      var showPinPost = false;

      // If in single post view, hide Pin Post
      //if (window.location.href.indexOf('pID=') >= 0) {
      //  return showPinPost;
      //}

      var siteEditors = common.getLocal('SiteEditors');
      if (!siteEditors) {
        return false;
      }      
      siteEditors.forEach(function(spId) {
        if (_spPageContextInfo.userId == Number(spId)) {
          showPinPost = true;
        }
      });

      return showPinPost;
    }

    /**
     * Init Method
     *
     * This runs on service init.
     */
    function init() {
      // All commented fields are not part of the Post list in SharePoint.
      hsToSp = {
        assignedto_id: 'AssignedToId',
        // contenttype
        datecompleted: 'DateCompleted',
        embed_media: 'Embed_x0020_Media',
        event_end_date: 'Event_x0020_End_x0020_Date',
        event_start_date: 'Event_x0020_Start_x0020_Date',
        id: 'Id',
        isEvent: 'isEvent',
        isKeyDate: 'isKeyDate',
        ispostupdatedbyothers: 'IsPostUpdatedByOthers',
        key_contacts_id: 'Key_x0020_ContactsId',
        likes_id: 'LikesId',
        // listid
        location: 'Location',
        mentions_id: 'MentionsId',
        microblog: 'Microblog',
        parentlistid: 'ParentListID',
        parentpostid: 'ParentPostID',
        parentpostsubweb: 'ParentPostSubweb',
        // parentpostsubwebtitle
        // parentwebfullurl
        // parentwebid
        // parentwebtitle
        // parentweburl
        // percentcomplete
        pinnedpost: 'PinnedPost',
        post_categories: 'Post_x0020_Categories',
        // post_categories_formatted
        post_firmwide: 'Post_x0020_Firmwide',
        post_status: 'Post_x0020_Status',
        postallowinteractivefeat: 'PostAllowInteractiveFeatures',
        postcategories: 'Post_x0020_Categories',
        // postcategories_guids
        postcontentowner_id: 'PostContentOwnerId',
        postdigest: 'PostDigest',
        postembedcode: 'PostEmbedCode',
        postincludeonhomepage: 'PostIncludeOnHomepage',
        postiscopy: 'PostIsCopy',
        postkeycontacts: 'PostKeyContacts',
        postopennewwindow: 'PostOpenNewWindow',
        postpublished: 'PostPublished',
        poststatus: 'Post_x0020_Status',
        postupdatedby_id: 'PostUpdatedById',
        postupdateddate: 'PostUpdatedDate',
        // posttype
        read_more_link: 'Read_x0020_More_x0020_Link',
        redirect_url: 'Redirect_x0020_URL',
        // sitetitle
        // siteurl
        tags: 'Tags',
        task: 'Task',
        taskduedate: 'TaskDueDate1',
        taskstatus: 'TaskStatus',
        postbody: 'PostBody',
        title: 'Title',
        // currentusercontentteam
        // currentusersubscribed
        createdbyid: 'CreatedId',
        keypost: 'KeyPost',
        reminderstart: 'ReminderStart',
        sendreminder: 'sendReminder'
        // site_editors_id
        // site_manager_id
        // site_owner_id
      }
    }

    init();

    return allMethods;
  }

})();