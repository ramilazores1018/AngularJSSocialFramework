(function () {
  "use strict";

  reconnectApp
    .directive("thread", directive);

  directive.$inject = ['hashtags', 'pplSvc', '$timeout'];

  function directive(hashtags, pplSvc, $timeout) {


    var directive = {
      templateUrl: "/_layouts/15/Connect/templates/Thread/interactive-thread.html",
      restrict: "E",
      // require: ['^posts', '^^feeds'],
      scope: {
        inputPostOriginSiteUrl: '@', // Used as URL of comment when on myconnect
        inputCommentData: "@",
        inputPostOwnerid: '@',
        inputSiteUrl: '@',
        inputPostId: '@',
        inputPost: '@',
        inputSiteTitle: '@'
      },
      controller: ThreadCtrl,
      controllerAs: "threadvm",
      link: link
    };



    function link(scope, elm, attrs, controllers) {

      $timeout(function () {
        $('.comment-popover').popover();
      }, 3000, true);


      angular.element('body').on('mouseover', function (e) {
        $('.comment-popover').popover();

      });


    }

    return directive;


  }

  ThreadCtrl.$inject = ["$rootScope", "$sce", "$scope", "$timeout", "$q", "pplSvc", "threadSvc", "tinymceSvc", "go", "timezone", "alertSvc", "common"];

  function ThreadCtrl($rootScope, $sce, $scope, $timeout, $q, pplSvc, threadSvc, tinymceSvc, go, timezone, alertSvc, common) {
    var threadvm = this;

    threadvm.defaultPic = '/_layouts/15/Connect/templates/feed/default-user.png';
    threadvm.contentOwnerId = $scope.inputPostOwnerid;
    threadvm.postId = $scope.inputPostId;
    threadvm.tinyComment;
    threadvm.user;
    threadvm.latestLikes;

    threadvm.sitetitle = threadvm.postObj ? threadvm.postObj.sitetitle : ($scope.inputSiteTitle) ? $scope.inputSiteTitle : _spPageContextInfo.webTitle;

    // threadvm.initEditCommentBox = initEditCommentBox;
    threadvm.formatCommentDate = formatCommentDate;
    threadvm.saveEditedComment = saveEditedComment;
    threadvm.toggleShowComments = toggleShowComments;
    threadvm.toggleShowReplies = toggleShowReplies;
    threadvm.toggleReplyInput = toggleReplyInput;
    // threadvm.initEditReplyBox = initEditReplyBox;
    threadvm.saveEditedReply = saveEditedReply;
    // threadvm.initCommentBox = initCommentBox;
    threadvm.initTinyBox = initTinyBox;
    threadvm.replyToComment = replyToComment;
    threadvm.deleteComment = deleteComment;
    threadvm.clearEditMode = clearEditMode;
    threadvm.unlikeComment = unlikeComment;
    threadvm.replyToReply = replyToReply;
    threadvm.editComment = editComment;
    threadvm.getComments = getComments;
    threadvm.likeComment = likeComment;
    threadvm.addComment = addComment;
    threadvm.editReply = editReply;
    threadvm.addReply = addReply;
    threadvm.viewShowLess = viewShowLess;

    threadvm.showMoreLess =  true;

    // threadvm.sitetitle = threadvm.postObj ? threadvm.postObj.sitetitle : $scope.inputSiteTitle;
    threadvm.postType = $scope.inputPost ? common.checkPostType(JSON.parse($scope.inputPost)) : 'Post';
    threadvm.noForId = common.getRandomNumber();
    
    threadvm.limitToComments = (window.location.href.indexOf('pID=') >= 0) ? 100 : -2;
    threadvm.limitToReplies = -1;
    threadvm.tinyContentStyle =
      ".mce-content-body {font-family: 'Arial' !important} " +
      ".mention { color: #0099cc;} " +
      ".hashtag {color: #0099cc;} " +
      "iframe {max-width:640px; max-height:360px;} " +
      "img {max-width:640px;} " +
      "p {margin:0!important;} " //  +
    // "html {overflow-y:auto;} ";

    threadvm.view = {
      hideCommentInputBox: false,
      isLoadingComments: true,
      showEditButton: false,
      hideEditIcon: false
    };

    //  ===================================================

    function init() {

      if (common.checkIfSinglePostView()) {

        threadvm.showMoreLess = false;
        threadvm.limitToComments = 100000;
        threadvm.limitToReplies = 100000;
      }

      $('.comment-popover').popover();

      if ($scope.inputPost) {
        threadvm.postObj = JSON.parse($scope.inputPost);
      }

      if (detectMobile()) {
        threadvm.containerWidth = "225px";
        threadvm.editCommentContainerWidth = "200px";
      } else {
        threadvm.containerWidth = "985px";
        threadvm.editCommentContainerWidth = "100%";
      }
      threadvm.rowWidth = "";

      getComments();
      getCurrentUserInfo();
    }

    function editComment(comment) {
      threadvm.view.hideCommentInputBox = true;
      threadvm.view.hideEditIcon = true;

      comment.hideEditInput = false;
      comment.hideLikesCtn = true;
      comment.inEditMode = true;
      comment.hideReplyInputBox = true;
      showEditIcon(comment);
      showXIcon(comment);
      // initEditCommentBox(comment.id, comment.postcomment);
      initTinyBox('comment', comment);

    }

    function setupTiny(type, comment) {
      var id = "", defaultText ="";
      if(comment){
        id = comment.id;
        if(comment.inEditMode){
          defaultText = comment.postComment;
          type = 'edit' + common.capitalize(type);
        }
      }else{
        id = threadvm.postId;
        defaultText = (type == 'comment') ? "Add a comment" : (type == 'reply') ? "Add a reply" : '';
      }

      var options = {
        fixed_toolbar_container: '#' + type + 'TinyToolbar-' + id + "-" + threadvm.noForId,
        selector: '#' + type + 'Input-' + id + "-" + threadvm.noForId,
        menubar: false,
        inline: true,
        toolbar: 'insert',
        content_style: threadvm.tinyContentStyle,
        defaultText: defaultText,
        plugins: ['media mediaembed image imagetools link mentions hashtags'],
        fn: function () {
          deferred.resolve(true);
        }
      };

      var checkIfTinyExists = common.checkTinyEditor(options.selector)
      if (checkIfTinyExists == false) {
        return tinymceSvc
          .newTinyMce(options)
          .then(function (res) {
            return res[0];
          })
      } else {
        // THIS TINY EDITOR EXISTS. RETURN IT.
        return $q.resolve(checkIfTinyExists);
      }
    }

    function initTinyBox(type, comment) {
      // if(!id) id= type + "Input-" +  threadvm.postId + "-" + threadvm.noForId;
      return setupTiny(type, comment)
        .then(function tiny(result) {
          if (result) {

            // Initialize
            var id = result.id;
            if (!threadvm[id]) threadvm[id] = result;
            threadvm[id].initContentBody();
            threadvm[id].focus();

            // Re-apply data on edit
            if (comment && comment.inEditMode) {
              if (typeof comment.postcomment == "object") {
                threadvm[id].setContent(comment.postcomment.$$unwrapTrustedValue());
              } else {
                threadvm[id].setContent(comment.postcomment);
              }
            }
            
            // Set cursor position
            threadvm[id].selection.select(threadvm[id].getBody(), true);
            threadvm[id].selection.collapse(false);
            return threadvm[id];
          }
        });
    }

    function hideOtherComments(comment) {
      var noOfComments = threadvm.comments.length;
      for (var index = 0; index < noOfComments; index++) {
        if (threadvm.comments[index].id != comment.id) {
          threadvm.comments[index].hideEditInput = true;
          threadvm.comments[index].hideReplyInputBox = true;
          clearEditMode(threadvm.comments[index]);
        }
      }
    }

    function showEditIcon(comment){
       (comment.editAccess && !comment.inEditMode) ? comment.showEditIcon = true : comment.showEditIcon = false;
       // inReplyMode TRIGGERS WHEN USER CLICKS ON REPLY TO A COMMENT OR REPLY
       if(comment.inReplyMode) comment.showEditIcon = false;
       return comment;
    }

    function showXIcon(comment){
      (comment.inEditMode || comment.inReplyMode) ? comment.showXIcon = true : comment.showXIcon=false;
      return comment
    }


    function replyToComment(comment) {
      hideOtherComments(comment);
      threadvm.view.hideCommentInputBox = true;
      threadvm.view.hideEditIcon = true;

      if (IsArray(comment.replies)) {
        for (var index = 0; index < comment.replies.length; index++) {
          comment.replies[index].hideEditInput = true;
        }
      }

      comment.hideReplyInputBox = false;
      comment.hideEditInput = true;
      comment.hideLikesCtn = true;
      // comment.inEditMode = true;
      comment.inReplyMode = true;
      showEditIcon(comment);
      showXIcon(comment);
      // threadvm.initCommentBox(comment.id, '');
      threadvm.initTinyBox('comment', comment);

    }

    function setupReply(reply) {
      var mention = tinymceSvc.mentions_menu_complete(tinyMCE.activeEditor, {
        sharepointid: reply.sharepointid,
        name: reply.name,
        timekeeperId: (reply.timekeeperId) ? reply.timekeeperId : reply.timekeeper_id
      });
      tinymce.activeEditor.setContent(mention.outerHTML);
      tinymce.activeEditor.selection.select(tinymce.activeEditor.getBody(), true);
      tinymce.activeEditor.selection.collapse(false);

      threadvm.view.hideCommentInputBox = true;
      threadvm.view.hideEditIcon = true;

      reply.hideReplyInputBox = false;
      reply.hideEditInput = true;
      reply.inEditMode = true;
    }

    function replyToReply(reply) {
      reply.inReplyMode = true;
      hideOtherComments(reply);
      //initCommentBox(reply.id, 'Add a Reply');
      initTinyBox('reply', reply)
        .then(function (editor) {
          if (!reply["sharepointid"]) {
            // GET sharepointid of user, if missing
            pplSvc.getUserByName(reply.name)
              .then(function getUserByNameSuccess(userObj) {
                reply["sharepointid"] = userObj.sharepointid;
                setupReply(reply);
              })
          } else {
            setupReply(reply);
          }
        })


    }

    function editReply(reply) {
      threadvm.view.hideCommentInputBox = true;
      threadvm.view.hideEditIcon = true;

      reply.hideEditInput = false;
      reply.hideLikesCtn = true;
      reply.inEditMode = true;
      reply = showEditIcon(reply);
      reply = showXIcon(reply);
      // initEditReplyBox(reply.id, reply.postcomment);
      initTinyBox('reply', reply);

    }

    function clearEditMode(comment) {
      //tinyMCE.activeEditor.setContent("");
      (tinymce.activeEditor) ? tinymce.activeEditor.destroy(): null;
      threadvm.view.hideCommentInputBox = false;
      threadvm.view.hideEditIcon = false;

      comment.hideReplyInputBox = true;
      comment.hideEditInput = true;
      comment.hideLikesCtn = false;
      comment.inEditMode = false;
      comment.inReplyMode = false;
      showEditIcon(comment);
      showXIcon(comment);
    }

    function toggleShowComments() {
      threadvm.limitToComments = threadvm.limitToComments === 100 ? -2 : 100;
      threadvm.viewShowLess = viewShowLess();
    }

    function toggleShowReplies(comment) {
      comment.limitToReplies = comment.limitToReplies === 100 ? -1 : 100;

      threadvm.limitToReplies =  comment.limitToReplies;
    }

    function getComments() {

      return threadSvc
        .getComments($scope.inputSiteUrl, $scope.inputPostId)
        .then(function (res) {

          if (res !== undefined) {

            $rootScope.$broadcast(('setCommentCountFor' + $scope.inputPostId), Number(res.length));

            res.forEach(function (comment) {
              // Mark comment's digest safe for HTML
              var postComment = comment.postcomment;
              postComment = common.decodeHTML(postComment);
              postComment = common.addLinkToImage(postComment);
              comment.postcomment = $sce.trustAsHtml(postComment);
              var commentLikes;

              if (comment.likes_id !== null) {
                commentLikes = comment.likes_id.split(';');
                comment.likeCount = commentLikes.length;

                var commentLikes = comment.likes_displayname ? comment.likes_displayname.split(";") : [];
                comment.latestLikes = buildLatestLikes(commentLikes);


                if (comment.likes_id.indexOf(_spPageContextInfo.userId) !== -1) {
                  comment.isLiked = true;
                }

              } else {
                comment.likeCount = 0;
                comment.latestLikes = '<div class="comment-likerslist"><div class="wc-post-liker">There are no likes for this item</div></div>';

              }

              // EDIT ACCESS
              (comment.__createdby_id == _spPageContextInfo.userId) ? comment.editAccess = true: comment.editAccess = false;
              if (comment.replies.length !== 0) {
                
                // Loop through nested replies
                var tempContainer = [];
                comment.replies.forEach(function(reply) {
                  if (reply.replies) {
                    tempContainer = tempContainer.concat(reply.replies);
                  }
                });
                
                // LOOP THROUGH EACH REPLY, GET LIKES
                comment.replies.forEach(function (reply) {
                  var replyLikes;
                  var postComment = reply.postcomment;
                  postComment = common.decodeHTML(postComment);
                  postComment = common.addLinkToImage(postComment);
                  reply.postcomment = $sce.trustAsHtml(postComment);

                  if (reply.likes_id !== null) {
                    if (reply.likes_id.indexOf(";") > 0) {
                      replyLikes = reply.likes_id.split(';');
                      reply.likeCount = replyLikes.length;
                    } else {
                      replyLikes = reply.likes_id
                      reply.likeCount = 1;
                    }

                    var commentReplyLikes = reply.likes_displayname ? reply.likes_displayname.split(";") : [];
                    reply.latestLikes = buildLatestLikes(commentReplyLikes);


                    if (reply.likes_id.indexOf(_spPageContextInfo.userId) >= 0) {
                      reply.isLiked = true;
                    }
                  } else {
                    reply.likeCount = 0;
                    reply.latestLikes = '<div class="comment-likerslist"><div class="wc-post-liker">There are no likes for this item</div></div>';

                  }
                  (reply.__createdby_id == _spPageContextInfo.userId) ? reply.editAccess = true: reply.editAccess = false;
                  reply = showEditIcon(reply);
                  reply = showXIcon(reply);
                });
              }
              comment = showEditIcon(comment);
              comment = showXIcon(comment);
            });
            threadvm.comments = res;
          } else {
            $rootScope.$broadcast(('setCommentCountFor' + $scope.inputPostId), 0);
            // NO COMMENTS CAME BACK
            threadvm.comments = [];
          }

        })
        .then(function () {
          $timeout(function () {
            // $('[data-toggle="popover"]').popover();
            threadvm.view.hideCommentInputBox = false;
            threadvm.view.isLoadingComments = false;
            threadvm.view.hideEditIcon = false;
          }, 500);
        });

    }

    function buildLatestLikes(likersArr) {
      var html = '<div class="comment-likerslist">';
      var i;
      var len = likersArr.length;

      // If no likes, display a text and return the html.
      if (len == 0) {
        html += "<div class='comment-liker'>There are no likes for this item</div>"
        html += "</div>";
        return html;
      }

      var i = likersArr.length - 1;
      while (i >= 0) {
        html += '<div class="comment-liker">' + likersArr[i] + "</div>";
        i--;
      }
      html += "</div>";

      return html;
    }

    function saveEditedComment(id, comment) {
      // var editedComment = tinymce.get('editCommentInput-' + id + "-" + threadvm.noForId).getContent();
      // var mentions = tinymce.get('editCommentInput-' + id + "-" + threadvm.noForId).plugins.mentions.getUsers();
      var editedComment = tinymce.activeEditor.getContent();
      var mentions = tinymce.activeEditor.plugins.mentions.getUsers();
      threadvm.view.hideCommentInputBox = true;
      threadvm.view.isLoadingComments = true;

      comment.postcomment = editedComment;

      return threadSvc
        .updateComment(comment)
        .then(function (data) {
          //tinyMCE.activeEditor.setContent('');
          tinymce.activeEditor.destroy();
          var inputUrl = $scope.inputPostOriginSiteUrl || '';
          if (inputUrl !== '') {
            inputUrl = inputUrl.substring(0, inputUrl.length - 1);
          }

          var siteLocation = window.location.href.indexOf('myconnect') !== -1 ? inputUrl : $scope.inputSiteUrl;
          var alertBody = {
            MentionsId: {
              results: returnMentions(mentions)
            },
            editorId: threadvm.contentOwnerId,
            PostDigest: editedComment,
            Id: $scope.inputPostId,
            siteUrl: siteLocation
          };

          //  alertSvc.alert(alertBody,threadvm.postType , 'EditComment', _spPageContextInfo.webTitle);
          getComments();
        });
    }

    function saveEditedReply(id, comment) {
      // var editedComment = tinymce.get('editReplyInput-' + id + "-" + threadvm.noForId).getContent();
      var editedComment = tinymce.activeEditor.getContent();
      var mentions = tinymce.activeEditor.plugins.mentions.getUsers();
      threadvm.view.hideCommentInputBox = true;
      threadvm.view.isLoadingComments = true;

      comment.postcomment = editedComment;

      return threadSvc
        .updateComment(comment)
        .then(function (data) {

          // tinyMCE.activeEditor.setContent('');
          tinymce.activeEditor.destroy();
          var inputUrl = $scope.inputPostOriginSiteUrl || '';
          if (inputUrl !== '') {
            inputUrl = inputUrl.substring(0, inputUrl.length - 1);
          }

          var siteLocation = window.location.href.indexOf('myconnect') !== -1 ? inputUrl : $scope.inputSiteUrl;
          var alertBody = {
            MentionsId: {
              results: returnMentions(mentions)
            },
            editorId: threadvm.contentOwnerId,
            PostDigest: editedComment,
            Id: $scope.inputPostId,
            siteUrl: siteLocation
          };

          alertSvc.alert(alertBody, threadvm.postType, 'EditComment', threadvm.sitetitle);
          getComments();
        });
    }

    function getCurrentUserInfo() {
      return pplSvc
        .getCurrentUser(_spPageContextInfo.userId)
        .then(function success(res) {
          threadvm.user = res;
        })
        .catch(function (err) {
          return err;
        });
    }

    function addComment() {
      // var usersMentionedInPost = tinymce.activeEditor.plugins.mentions.getUsers();
      try {
        var comment = tinyMCE.activeEditor.getContent();
        var tagstoSave = tinyMCE.activeEditor.plugins.hashtags.getUsers();
        var mentions = tinyMCE.activeEditor.plugins.mentions.getUsers();

        var isMentionExist = comment.indexOf("mentionsSelector");
        var endOfMentionCount = comment.lastIndexOf("</a></span>");
        var firstPhrase = comment.substr(0, endOfMentionCount);
        var secondPhrase = comment.substr(endOfMentionCount + 11, comment.length + 1);

        if (isMentionExist > -1) {

          comment = firstPhrase + "</a></span> " + secondPhrase;
        }

        if (comment) {
          threadvm.view.hideCommentInputBox = true;
          threadvm.view.isLoadingComments = true;
          threadSvc
            .addComment(comment, $scope.inputSiteUrl, $scope.inputPostId, threadvm.user, tagstoSave)
            .then(function (data) {
              var inputUrl = $scope.inputPostOriginSiteUrl || '';
              var siteUrl = $scope.inputSiteUrl || '';

              // if (inputUrl !== '' && (inputUrl.lastIndexOf("/") == inputUrl.length - 1)) {
              //   inputUrl = inputUrl.substring(0, inputUrl.length - 1);
              // }

              // if(siteUrl !== '' && (siteUrl.lastIndexOf("/") == siteUrl.length - 1)){
              //   siteUrl = $scope.inputSiteUrl.substring($scope.inputSiteUrl.length -1, 0);
              // }

              var siteLocation = window.location.href.indexOf('myconnect') !== -1 ? inputUrl : siteUrl;

              var alertBody = {
                MentionsId: {
                  results: returnMentions(mentions)
                },
                editorId: threadvm.contentOwnerId,
                PostDigest: comment,
                Id: $scope.inputPostId,
                siteUrl: siteLocation
              };


              alertSvc.alert(alertBody, threadvm.postType, 'AddComment', threadvm.sitetitle);

              tinyMCE.activeEditor.setContent('');
              $timeout(function () {
                getComments();
              }, 500);
            });
        }
      } catch (error) {
        go.handleError(error);
      }
    }

    function returnMentions(mentionsArr) {
      var arrOfIds = [];

      if (!mentionsArr) return [];

      mentionsArr.forEach(function (mention) {
        arrOfIds.push(mention.sharepointid);
      });

      return arrOfIds;
    }

    function deleteComment(comment) {
      var validDelete = confirm('Are you sure you want to delete your comment?');

      if (validDelete) {
        threadvm.view.isLoadingComments = true;
        threadSvc
          .deleteComment(comment.id)
          .then(function (data) {
            getComments();
          })

      } else {
        clearEditMode(comment);
      }
    }

    function addReply(commentId, reply, type) {
      //var usersMentionedInPost = tinyMCE.activeEditor.plugins.mentions.getUsers();

      //var reply = tinyMCE.activeEditor.getContent();
      var id = type + 'Input-' + reply.id + "-" + threadvm.noForId
      //threadvm[id].initContentBody();
      var reply = threadvm[id].getContent();
      
      var usersMentionedInPost = threadvm[id].plugins.mentions.getUsers();

      var tagstoSave = tinyMCE.activeEditor.plugins.hashtags.getUsers()

      threadvm.view.hideCommentInputBox = true;
      threadvm.view.isLoadingComments = true;

      return threadSvc
        .addReply(reply, $scope.inputSiteUrl, $scope.inputPostId, commentId, threadvm.user, usersMentionedInPost, tagstoSave)
        .then(function (data) {

          var inputUrl = $scope.inputPostOriginSiteUrl || '';
          if (inputUrl !== '') {
            inputUrl = inputUrl.substring(0, inputUrl.length - 1);
          }

          var siteLocation = window.location.href.indexOf('myconnect') !== -1 ? inputUrl : $scope.inputSiteUrl;
          var alertBody = {
            MentionsId: {
              results: returnMentions(usersMentionedInPost)
            },
            editorId: threadvm.contentOwnerId,
            PostDigest: reply,
            Id: $scope.inputPostId,
            siteUrl: siteLocation
          };

          alertSvc.alert(alertBody, threadvm.postType, 'AddComment', threadvm.sitetitle);

          (tinymce.activeEditor) ? tinymce.activeEditor.destroy() : null;
          getComments();
        });
    }

    function toggleReplyInput(commentObj) {
      commentObj.showReplyInput = !commentObj.showReplyInput;
      threadvm.replyEditMode = !threadvm.replyEditMode;
    }

    function likeComment(comment) {
      var currentLikes = comment.likes_id;

      comment.likeCount++;
      comment.isLiked = true;

      go
        .getHS('WCPeopleSvc?hsf=@timekeeperid=' + comment.timekeeper_id)
        .then(function (res) {
          var editor = res.data.d.results[0];

          threadSvc
            .updateLike('Like', comment.id, currentLikes)
            .then(function (res) {

              var alertBody = {
                MentionsId: {
                  results: []
                },
                editorId: editor.sharepointid,
                PostDigest: '',
                Id: $scope.inputPostId,
                siteUrl: threadvm.postObj.parentwebfullurl || _spPageContextInfo.webAbsoluteUrl
              };

              alertSvc.alert(alertBody, 'Comment', 'Like', threadvm.sitetitle);
              getComments();
            });

        });
    }

    function unlikeComment(comment) {
      var currentLikes = comment.likes_id;
      comment.likeCount--;
      comment.isLiked = false;

      threadSvc.updateLike('Unlike', comment.id, currentLikes)
        .then(function (res) {
          getComments();

        });
    }

    function detectMobile() {
      if (/Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Mobile device
        return true;
      } else {
        return false;
        //window.addEventListener("resize", sideNavClose);
      }
    }

    function detectIpad() {
      if (/iPad|iPod/i.test(navigator.userAgent)) {
        // Mobile device
        return true;
      } else {
        return false;
        //window.addEventListener("resize", sideNavClose);
      }
    }


    function formatCommentDate(date) {
      if (!date) return;
      date = timezone.getFormattedDateTime(date, false, "MMM DD YYYY h:mma");
      return date;
    }

    function toggleEditPostAccess() {
      //var ApprovedEditUsersList = [];
      //Number(postvm.post.currentusercontentteam) > 0 ? postvm.editPostAccess = true : null;
      // postvm.post.postcontentowner_id == _spPageContextInfo.userId ? postvm.editPostAccess = true : null;
      // postvm.post.createdbyid == _spPageContextInfo.userId ? postvm.editPostAccess = true : null;
      // ApprovedEditUsersList = handleSiteEditorsMatch()
      // ApprovedEditUsersList.forEach(function (spid, idx) {
      //   if (_spPageContextInfo.userId == Number(spid)) {
      //     postvm.editPostAccess = true
      //   }
      // });
      if (threadvm.contentOwnerId == _spPageContextInfo.userId) threadvm.editAccess = true;
    }

    function viewShowLess() {
      // Returns true when NOT on Single Post view.
      return (window.location.href.indexOf('pID') == -1);
    }

    init();
  }
})();