(function () {
  'use strict';

  reconnectApp
    .directive("posts", postDir);

  postDir.$inject = ['$timeout'];

  function postDir($timeout) {
    // $compileProvider.aHrefSanitizationWhitelist()

    var directive = {
      templateUrl: "/_layouts/15/Connect/templates/Post/interactive-post.html",
      restrict: 'E',
      scope: {
        inputDisableComments: "@",
        inputMobileGrid: "@",
        inputPostData: "@",
        inputGrid: "@",
        inputFollowing: "@",
        inputEditAccess: "@",
        inputPostId: "@",
        inputSiteUrl: "@",
        inputReadmoreSitesToSkip: "@" // String sites to skip. Pass to readmore directive
      },
      link: link,
      controller: PostCtrl,
      controllerAs: "postvm"
    };

    function link(scope, elm, attrs) {
      $timeout(function () {
        $("[data-id=tag]").popover();
      }, 0, true);
    }
    return directive;
  }

  PostCtrl.$inject = ["$rootScope", "$scope", "$sce", '$anchorScroll', '$location', "postSvc", "timezone", "socialDataSvc", 'tinymceSvc', 'alertSvc', 'go', 'common', 'hashtags', 'pplSvc'];

  // * POST CONTROLLER
  function PostCtrl($rootScope, $scope, $sce, $anchorScroll, $location, postSvc, timezone, socialDataSvc, tinymceSvc, alertSvc, go, common, hashtags, pplSvc) {
    var postvm = this;

    postvm.checkIfPostOwnerIsCurrentUser = checkIfPostOwnerIsCurrentUser;
    postvm.unsubscribeFromPost = unsubscribeFromPost;
    postvm.followHashtag = hashtags.followHashtag;
    postvm.unFollowHashtag = hashtags.unFollowHashtag;
    postvm.toggleShareToSite = toggleShareToSite;
    postvm.isShowingAllSites = isShowingAllSites;
    postvm.initShareTinymce = initShareTinymce;
    postvm.buildLatestLikes = buildLatestLikes;
    postvm.toggleSharePane = toggleSharePane;
    postvm.subscribeToPost = subscribeToPost;
    postvm.formatHashtags = formatHashtags;
    postvm.shareByEmail = sharePostByEmail;
    postvm.cleanCategory = cleanCategory;
    postvm.postFeedback = postFeedback;
    postvm.quickPublish = quickPublish;
    postvm.showComments = showComments;
    postvm.processDate = processDate;
    postvm.unlikePost = unlikePost;
    postvm.deletePost = deletePost;
    postvm.singlePost = false;
    postvm.userSubscribed = false;
    postvm.sharePost = sharePost;
    postvm.likePost = likePost;
    postvm.editPost = editPost;
    postvm.siteSharedTo = null;
    postvm.commentCount = 0;
    postvm.isDraft = false;
    postvm.allSites = null;
    postvm.showReadMore = true;
    postvm.post = null;
    postvm.noForId;
    postvm.tinyShare;
    postvm.thisSiteLink;
    postvm.allSitesLink;
    postvm.isMatters = common.isMatters();
    postvm.editPostAccess = ($scope.inputEditAccess == "true") ? true : false;
    postvm.deletePostAccess = ($scope.inputDeleteAccess == "true") ? true : false;    
    // FOLLOWING USED FOR HASHTAG MENU
    postvm.following = ($scope.inputFollowing) ? true : false;
    postvm.showMoreLikes;
    postvm.readmoreSitesToSkip;
    postvm.hideInEditMode = false;
    postvm.showPinMarker = showPinMarker;

    postvm.viewCtrl = {
      showComments: $scope.inputDisableComments === 'true' ? false : true,
      mobileGrid: postvm.inputMobileGrid || 12,
      grid: postvm.inputGrid || 12,
      showActionSelect: true,
      showShareBySite: false,
      showPostActions: false,
      isLoadingShare: false,
      showSharePane: false,
      showErrorPane: false,
      isPostLiked: false,
      likesLoader: false,
      isLoading: false
    };

    // * CONTROLLER METHODS =========================================================

    function init() {
      postvm.readmoreSitesToSkip = $scope.inputReadmoreSitesToSkip;
      postvm.noForId = common.getRandomNumber(); //Used to assign random IDs to elements so multiple posts/feeds on a single page don't have overlapping element IDs
      // INITIALIZE POPOVER FUNCTIONALITY
      $('[data-toggle="popover"]').popover();

      if (!common.isNullOrWhitespace($scope.inputPostId) && !common.isNullOrWhitespace($scope.inputSiteUrl)) {
        postvm.showReadMore = false;
        postSvc.getSinglePost($scope.inputSiteUrl, $scope.inputPostId)
          .then(function (res) {
            postvm.post = res[0];
            showComments();
            processPost();
            $scope.$on(('setCommentCountFor' + postvm.post.id), function (event, count) {
              postvm.commentCount = count;
            });
          });

      } else if (!common.isNullOrWhitespace($scope.inputSiteUrl) && common.isNullOrWhitespace($scope.inputPostId)) {
        // GET POSTS IF SITEURL IS PASSED WITH NO POSTID

      } else {

        // PARSE PASSED IN POST OBJECT
        postvm.post = JSON.parse($scope.inputPostData);

        processPost();
        $scope.$on(('setCommentCountFor' + postvm.post.id), function (event, count) {
          postvm.commentCount = count;
          showReadMoreData();
        });

      }

    }

    function deletePost(post) {
      var siteurl = post.parentwebfullurl;
      var id = post.id;
      var type = (post.isevent == true) ? 'Event' : post.posttype;
      var shouldDelete = confirm("Delete?");

      if (shouldDelete == true) {

        postSvc
          .deletePost(siteurl, id)
          .then(function (res) {
            //feedCtrl.refreshFeed();
            var options = {
              text: type + " has been deleted!",
              direction: "topCenter"
            };
            $scope.$emit('toast', options);

            var url = window.location.href.toLowerCase();
            if (url.indexOf("post.aspx") >= 0) {
              // ON SINGLE PAGE VIEW
              // REDIRECT TO HOMEPAGE OF WEB
              window.location.href = _spPageContextInfo.webAbsoluteUrl;
            } else {
              $rootScope.$broadcast('refreshFeed');
            }

          });

      } else {
        return;
      }
    }

    function editPost() {
      if (common.isOnHomepage()) window.location = postvm.post.parentwebfullurl + "/pages/post.aspx?mode=edit&pID=" + postvm.post.id;

      $location.hash('sp-content-container');
      $anchorScroll();
      $rootScope.$broadcast('editPost', postvm.post);

      $rootScope.$broadcast('hideFilterControlOnEditMode');

      postvm.hideInEditMode = true;

    }

    function postFeedback() {
      var body = "Click here to view " + postvm.post.parentwebfullurl + "/pages/post.aspx?pID=" + postvm.post.id;
      var subject = "Feedback about: " + postvm.post.title;

      document.location.href =
        "mailto:connect@whitecase.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }

    function subscribeToPost(postId) {
      var isHomePage = _spPageContextInfo.webServerRelativeUrl == '/';
      var siteUrl = isHomePage ? postvm.post.siteurl.substr(0, postvm.post.siteurl.length - 1) : _spPageContextInfo.webAbsoluteUrl;

      alertSvc
        .subscribe(postId, _spPageContextInfo.userId, 'post_subscriber', siteUrl)
        .then(function (res) {
          postvm.post.currentusersubscribed = 1;
        });
    }

    function unsubscribeFromPost() {
      var isHomePage = _spPageContextInfo.webServerRelativeUrl == '/';
      var siteUrl = isHomePage ? postvm.post.siteurl.substr(0, postvm.post.siteurl.length - 1) : _spPageContextInfo.webAbsoluteUrl;

      alertSvc
        .unsubscribe(postvm.post.id, _spPageContextInfo.userId, siteUrl)
        .then(function (res) {
          postvm.post.currentusersubscribed = 0;

        });
    }

    function isShowingAllSites() {

      if (_spPageContextInfo.webServerRelativeUrl === '/') {
        return true;
      }

      return false;
    }

    function quickPublish() {
      postSvc.publishPost(postvm.post.id)
        .then(function (result) {
          
          // Override Pinned Post if any
          if (postvm.post.pinnedpost) {
            postSvc.overridePinnedPost();
          }

          $rootScope.$broadcast('refreshFeed', result);
          window.location.href = window.location.href.split('\/pages')[0];
        });            
    }

    //==========================
    // * VIEW TOGGLES
    //==========================
    function togglePostLike() {
      return (postvm.viewCtrl.isPostLiked = !postvm.viewCtrl.isPostLiked);
    }

    function toggleSharePane(clearFlag) {
      if (clearFlag) {
        postvm.viewCtrl.showActionSelect = true;
        postvm.viewCtrl.showShareBySite = false;
      }

      toggleComments();
      return (postvm.viewCtrl.showSharePane = !postvm.viewCtrl.showSharePane);
    }

    function toggleComments() {
      return (postvm.viewCtrl.showComments = !postvm.viewCtrl.showComments);
    }

    function toggleShareToSite() {
      postvm.viewCtrl.showActionSelect = !postvm.viewCtrl.showActionSelect;
      postvm.viewCtrl.showShareBySite = !postvm.viewCtrl.showShareBySite;

      setAllSites()
        .then(function () {

          // IF SHARE PANEL IS BEING OPENED, INIT MAGIC SUGGEST
          if (postvm.viewCtrl.showShareBySite) {
            initShareTinymce(postvm.post.id, 'Share your thoughts');
            initShareSitePicker();

          }

        });

    }

    function toggleLoader() {
      return (postvm.viewCtrl.isLoading = !postvm.viewCtrl.isLoading);
    }

    //==========================
    // * SHARE POST
    //==========================

    function sharePost(postObj) {
      // sharedTo is an array of all sites shared to with id and link as properties. 
      var sharedTo = postvm.siteSharedTo.getSelection();
      var message = tinyMCE.activeEditor.getContent();

      toggleSharePane();
      toggleLoader();

      postSvc
        .createSharedPost(
          sharedTo, {
            message: message || '',
            post: postvm.post
          })
        .then(
          function (res) {
            // RESULT OF EACH SITE POST WAS SHARED TO
            if (res && res.length > 0) {
              res.forEach(function (result) {
                var post = result.data.d;
                var pos = result.config.url.indexOf("_api");
                if (pos > 0) {
                  // GET URL OF WHERE POST WAS SHAREDTO
                  var url = result.config.url.substr(0, pos - 1);
                  var postType = common.checkPostType(postvm.post);
                  // var sharedTo = postvm.siteSharedTo.getSelection();
                  // if (sharedTo.length > 0) {
                  //  sharedTo.forEach(function (share, i) {
                  var alertBody = {
                    MentionsId: {
                      results: []
                    },
                    editorId: postvm.post.postcontentowner_id,
                    // This assumes we're sharing to one site. 
                    siteUrl: url, // postvm.post.linkToPost,
                    PostDigest: message,
                    Id: post.ID // postvm.post.id,
                  };

                  alertSvc.alert(alertBody, postType, 'Share', _spPageContextInfo.webTitle);
                  // });
                  // }
                }
              });
            }
            toggleLoader();
            

            var options = {
              text: "Post Shared Successfully!",
              direction: "topCenter"
            };
            $rootScope.$broadcast('toast', options);

            postvm.siteSharedTo.clear();
            postvm.tinyShare[0].setContent('');
          },
          function (err) {
            toggleLoader();
            toggleError("Unable to share post. Please refresh the page and try again.");

            handleError(err);
          }
        );
    }

    function sharePostByEmail() {
      var subject = "This post has been shared with you - " + postvm.post.title;
      var body = postvm.post.parentwebfullurl + "/pages/post.aspx?pID=" + postvm.post.id;

      document.location.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURI(encodeURI(body));
    }

    //==========================
    // * LIKE FUNCTIONS
    //==========================

    function unlikePost() {
      var siteUrl = postvm.post.parentwebfullurl;
      var currentLikesId = postvm.post.likes_id;
      var currentLikesDisplay = postvm.post.likes_displayname;
      currentLikesDisplay = currentLikesDisplay.join(';');
      var postId = postvm.post.id;

      postvm.post.likeCount--;

      togglePostLike();
      postSvc
        .updateLike('Unlike', siteUrl, postId, currentLikesId)
        .then(function () {
          currentLikesDisplay = currentLikesDisplay.split(';');
          currentLikesDisplay.forEach(function (liker, i) {
            pplSvc.getCurrentUser(_spPageContextInfo.userId)
              .then(function (user) {
                if (liker == user.name) {
                  currentLikesDisplay.splice(i, 1);
                }
                postvm.post.latestLikes = buildLatestLikes(currentLikesDisplay);
                postvm.post.likes_displayname = currentLikesDisplay;
              });
          });
        });
    }

    function likePost() {
      var siteUrl = postvm.post.parentwebfullurl;
      var currentLikes = postvm.post.likes_id;
      var postId = postvm.post.id;
      var injectedArr = postvm.post.likes_displayname;

      postvm.post.likeCount++;

      // Add user to list of likers displaynames and inject into page
      socialDataSvc.getCurrentUser()
        .then(function (res) {
          //  injectedArr.push(res.name);
          injectedArr.unshift(res.name);
          postvm.post.latestLikes = buildLatestLikes(injectedArr);

        });

      togglePostLike();

      postSvc
        .updateLike('Like', siteUrl, postId, currentLikes)
        .then(function (data) {

          var alertBody = {
            MentionsId: {
              results: []
            },
            editorId: postvm.post.postcontentowner_id,
            PostDigest: '',
            Id: postvm.post.id,
            siteUrl: siteUrl,
            siteName: postvm
          };

          alertSvc.alert(alertBody, 'Post', 'Like', _spPageContextInfo.webTitle);
        });
    }

    function expandLikes() {
      postvm.showMoreLikes = !postvm.showMoreLikes;
    }

    function buildLatestLikes(likersArr) {
      var html = '<div class="wc-post-likerslist">';
      var i;
      var len = likersArr.length;

      // If no likes, display a text and return the html.
      if (len == 0) {
        html += "<div class='wc-post-liker'>There are no likes for this item</div>"
        html += "</div>";
        return html;
      }

      /*if (len < 5) {
        for (i = 0; i < len; i++) {
          if (likersArr[i] === undefined) break;
          html += '<div class="wc-post-liker">' + likersArr[i] + "</div>";
        }
      } else {
        for (i = 0; i < 5; i++) {
          if (likersArr[i] === undefined) break;
          html += '<div class="wc-post-liker">' + likersArr[i] + "</div>";
        }

        html += "<span ng-click='postvm.expandLikes()'>See more</span>"
      }*/
      for (i = 0; i < len; i++) {
        if (likersArr[i] === undefined) break;
        html += '<div class="wc-post-liker">' + likersArr[i] + "</div>";
      }

      html += "</div>";

      return html;
    }

    function checkIfUserLikedPost(likeIds) {
      if (likeIds === null) {
        return;
      }

      var currentUserId = _spPageContextInfo.userId;
      var likesArr = likeIds.split(";");

      likesArr.forEach(function (liker) {
        if (liker == currentUserId) {
          postvm.viewCtrl.isPostLiked = true;
        }
      });
    }

    //==========================
    // * SET FUNCTIONS
    //==========================
    function setCommentCount() {
      return postSvc
        .getCommentCount(postvm.post.parentwebfullurl, postvm.post.id)
        .then(function (res) {
          postvm.commentCount = res;
        });
    }

    function setAllSites() {
      return socialDataSvc
        .getAllSites()
        .then(function (res) {
          postvm.allSites = res;
        });
    }

    function formatHashtags(tag) {
      return tag.split(':')[0];
    }

    function cleanCategory(str) {
      return str.replace(/^.*?:/, '');
    }

    //==========================
    // * INIT FUNCTIONS
    //==========================
    function initShareSitePicker() {
      var elm = "#siteShareCtrl-" + postvm.post.id + "-" + postvm.noForId
      postvm.siteSharedTo = $(elm).magicSuggest({
        placeholder: "Select site(s)",
        data: postvm.allSites,
        sortOrder: 'name'
      });

    }

    function checkIfPostOwnerIsCurrentUser() {
      var currentUserId = _spPageContextInfo.userId;
      var check = postvm.post.postcontentowner_id == currentUserId || postvm.post.createdbyid == currentUserId;
      return check;
    }

    function initShareTinymce(id, placeholder) {
      var elm = '#shareMessageCtrl-' + (id || postvm.post.id) + "-" + postvm.noForId;
      var options = {
        selector: elm,
        inline: true,
        hideToolbar: true,
        defaultText: placeholder || 'Add a comment',
        fn: function () {
          deferred.resolve(true);
        }
      };

      return tinymceSvc
        .newTinyMce(options)
        .then(function (res) {
          postvm.tinyShare = res;
        })
        .catch(function (err) {
          return err;
        });
    }

    function processDate(date, noFromNow, format) {
      if (!date) return;
      if (!format || format == '') format = "MMM DD YYYY h:mma";
      date = timezone.getFormattedDateTime(date, noFromNow, format);
      return date;
    }

    function showComments() {

      if (!postvm.post) return false;

      // IF HIDE COMMENTS IS PASSED IN, RETURN FALSE TO NOT SHOW COMMENTS
      if (
        !postvm.post.postallowinteractivefeat ||
        !postvm.viewCtrl.showComments
      ) {
        return false;
      }

      return true;

    }

    function removeSpExtraDiv(digest) {
      if (!digest) return;
      //Remove div tag use a regular expression
      // var reg1 = new RegExp("<div class=\"ExternalClass[0-9A-F]+\">[^<]*");
      // var reg2 = new RegExp("</div>$");
      var reg1 = /<div class=\"ExternalClass[0-9A-F]+\">[^<]*/gmi;
      var reg2 = /<\/div>/gmi;
      digest = digest.replace(reg1, "").replace(reg2, "");
      return digest;
    }

    function processPost() {
      var digestData = "";
      var keyContactsArr;
      var keyContactUrl = "WCPeopleSvc?$select=photo,name,jobtitle,timekeeperid,displaydepartment&hsf=@sharepointid=";

      // REFORMAT FIELDS FOR PRESENTATION
      postvm.post.likes_displayname = postvm.post.likes_displayname ? postvm.post.likes_displayname.split(";") : []; // SPLIT LIKES INTO ARRAY
      postvm.post.latestLikes = buildLatestLikes(postvm.post.likes_displayname); // BUILD LIKES HOVER PANEL HTML
      postvm.post.isShare = postvm.post.parentpostsubweb ? true : false; // DETECT SHARED POSTS
      postvm.post.categories = postvm.post.post_categories !== null ? postvm.post.post_categories.split(';') : []; // SPLIT CATEGORIES INTO ARRAY
      postvm.post.categories.pop(); // REMOVE EMPTY STRING FROM ARRAY.
      postvm.post.likeCount = postvm.post.likes_displayname.length; // SET POST COUNT

      if(postvm.isMatters){
        postvm.post.linkToPost = _spPageContextInfo.siteAbsoluteUrl+ _spPageContextInfo.serverRequestPath+'?tab=activity&client=' + postvm.post.client + '&matter='+ postvm.post.matter +'&pID='+ postvm.post.id;

      }
            else {
        postvm.post.linkToPost = postvm.post.redirect_url ? postvm.post.redirect_url : String(postvm.post.parentwebfullurl + '/pages/post.aspx?pID=' + postvm.post.id);

      }

      // MATTER FIELD ASSIGNMENTS

      digestData = (postvm.post.postdigest) ? postvm.post.postdigest : digestData;

      // When the value of digest is 'no digest', it probably is an old post.
      // Replace the 'no digest' with blank string instead.
      if(digestData.indexOf("<div") != 0) digestData = "<div>" + digestData + "</div>";
      var tempDigestData = $(digestData).html();
      digestData = (tempDigestData && tempDigestData.indexOf('no digest') == 0) ? '' : digestData;

      if (postvm.post.postbody && postvm.post.postbody !== null) {
        digestData = common.decodeHTML(digestData + postvm.post.postbody);
      } else {
        digestData = common.decodeHTML(digestData);
      }
      // digestData = removeSpExtraDiv(digestData);
      digestData = hashtags.processDigestForHashtags(digestData, $scope.inputFollowing, postvm.post.siteurl);

      // TEST FOR EMBED CODE IN DIGEST
      if (postvm.post.postembedcode) {
        var foundEmbedIndDigest = false;
        var regex = []
        regex[0] = /<iframe.*?src="(.*?)"/;
        regex[1] = /<iframe.*?src='(.*?)'/;
        regex[2] = /<param.*?value="(.*?)"/;
        regex[3] = /<param.*?value='(.*?)'/; // Extract src attribute from iframe

        regex.forEach(function (currentReg, i, arry) {
          var src = currentReg.exec(postvm.post.postembedcode)
          if (common.isArray(src) && src.length > 0) {
            if (digestData.indexOf(src[1]) < 0) {
              //IE11 doesn't suppourt includes
              // ADD EMBED CODE TO DIGEST IF NOT THERE
              digestData = (foundEmbedIndDigest == false) ? digestData += '</br>' + postvm.post.postembedcode : digestData;
              foundEmbedIndDigest = true
            }
          }
        });
      }

      // WRAPS IMAGE TAGS WITH AN ANCHOR.
      digestData = common.addLinkToImage(digestData);

      // ASSIGN DIGEST TO THE DISPLAY DIGEST FIELD, LEAVING THE ORIGINAL DIGEST UNCHANGED FOR EDIT VIEW.
      postvm.post.displayDigest = $sce.trustAsHtml(digestData);

      if (postvm.post.post_status === 'Draft' || postvm.post.post_status !== 'Published') {
        postvm.post.isDraft = true;
      }

      // SET LOCAL VARIABLE TO CHECK IF USER IS ALREADY SUBSCRIBED TO A POST
      postvm.userSubscribed = postvm.post.currentusersubscribed == 1 ? true : false;

      // IF KEY CONTACTS SPLIT INTO ARRAY AND GET PEOPLE DATA
      if (postvm.post.key_contacts_id !== null) {
        postvm.post.keyContactsData = [];
        
        if (!common.isArray(postvm.post.key_contacts_id)) {
          var tempVal = postvm.post.key_contacts_id;
          postvm.post.key_contacts_id = [tempVal];  
        }
        
        keyContactsArr = postvm.post.key_contacts_id;

        keyContactsArr.forEach(function (contactId) {
          go
            .getHS(keyContactUrl + contactId)
            .then(function (res) {
              postvm.post.keyContactsData.push(res.data.d.results[0]);
            });
        });

      }

      // IF POST IS SHARE, GET SHARED POST DATA
      if (postvm.post.isShare) {

        postvm.viewCtrl.isLoadingShare = true;

        postSvc
          .getPostsForShares(postvm.post)
          .then(function (res) {
            postvm.viewCtrl.isLoadingShare = false;
            if (res) {
              postvm.post.shareData = res;

              try {
                var digest = postvm.post.shareData.postdigest;

                if (common.isNullOrWhitespace(digest) || digest == 'null') {

                  postvm.post.shareData.shareDisplayDigest = "";

                } else {

                  digest = common.decodeHTML(digest);
                  digest = hashtags.processDigestForHashtags(digest, $scope.inputFollowing, postvm.post.siteurl);
                  digest = common.addLinkToImage(digest);
                  postvm.post.shareData.shareDisplayDigest = $sce.trustAsHtml(digest);

                }

                //Updated for postDIgest = null in IE issue
                //postvm.post.shareData.shareDisplayDigest = $sce.trustAsHtml(digest);
              } catch (err) {
                go.handleError(err);
              }
            } else {
              // res == null
              // Likely original post was deleted.
              postvm.post.shareData = {};
              postvm.post.shareData.isDeleted = true;
              postvm.post.shareData.shareDisplayDigest = "This post/event has been deleted.";
            }
          });

      }

      checkIfUserLikedPost(postvm.post.likes_id);

      // IF POST HAS SHARE DATA, BIND THAT TO THE SCOPE
      if (postvm.post.hasOwnProperty("shareData")) {
        postvm.share = postvm.post.shareData;
      }

      // SETUP EDIT ACCESS
      toggleEditPostAccess();

      // SETUP DELETE ACCESS
      toggleDeletePostAccess();

    }

    function handleSiteEditors(editors) {
      if (editors != null) {
        var arr = [];
        if (editors.indexOf(";") >= 0) {
          editors = editors.split(";");
          editors.forEach(function (id, idx, arry) {
            arr.push(id);
          })
        } else {
          // One ID
          arr.push(editors);
        }
        return arr;
      } else {
        return [];
      }
    }

    function handleSiteEditorsMatch() {
      var ApprovedEditUsersList, editorsArray, ownersArray, managersArray = [];
      ApprovedEditUsersList = ['9273', '9783', '9809', '328'];
      editorsArray = handleSiteEditors(postvm.post.site_editors_id);
      ownersArray = handleSiteEditors(postvm.post.site_owner_id);
      managersArray = handleSiteEditors(postvm.post.site_manager_id);
      ApprovedEditUsersList = ApprovedEditUsersList.concat(editorsArray, ownersArray, managersArray);
      // GIVE ASSISGNED TO EDIT/DELETE ACCESS
      if(postvm.post.assignedto_id) ApprovedEditUsersList.push(postvm.post.assignedto_id);
      return ApprovedEditUsersList;
    }

    function toggleEditPostAccess() {
      var ApprovedEditUsersList = [];
      Number(postvm.post.currentusercontentteam) > 0 ? postvm.editPostAccess = true : null;
      postvm.post.postcontentowner_id == _spPageContextInfo.userId ? postvm.editPostAccess = true : null;
      postvm.post.createdbyid == _spPageContextInfo.userId ? postvm.editPostAccess = true : null;
      ApprovedEditUsersList = handleSiteEditorsMatch()
      ApprovedEditUsersList.forEach(function (spid, idx) {
        if (_spPageContextInfo.userId == Number(spid)) {
          postvm.editPostAccess = true
        }
      });
    }

    function toggleDeletePostAccess() {
      var ApprovedEditUsersList = [];
      Number(postvm.post.currentusercontentteam) > 0 ? postvm.deletePostAccess = true : null;
      postvm.post.postcontentowner_id == _spPageContextInfo.userId ? postvm.deletePostAccess = true : null;
      postvm.post.createdbyid == _spPageContextInfo.userId ? postvm.deletePostAccess = true : null;
      ApprovedEditUsersList = handleSiteEditorsMatch();
      ApprovedEditUsersList.forEach(function (spid, idx) {
        if (_spPageContextInfo.userId == Number(spid)) {
          postvm.deletePostAccess = true
        }
      });
    }

    function showReadMoreData() {

      postvm.singlePost = common.checkIfSinglePostView();

      if (!postvm.singlePost) {
        postvm.showReadMore = true;
      }

    }

    $rootScope.$on('hidePostOnEditMode', function (event, data) {

      postvm.hideInEditMode = true;
      //console.log("Triggered  hideOnEditMode -> value = "+  postvm.hideInEditMode);

    });

    $rootScope.$on('showPostAfterEditMode', function (event, data) {

      postvm.hideInEditMode = false;
      //console.log("Triggered  showPostAfterEditMode -> value = "+  postvm.hideInEditMode);

    });

    function showPinMarker(post) {
      
      if (!post) return false;

      var show = false;

      if (!common.isOnHomepage()) {
        if (post.pinnedpost) show = true;
      }

      return show;

    }

    init();
  }
}());