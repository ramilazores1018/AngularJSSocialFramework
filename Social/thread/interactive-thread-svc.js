(function () {
  'use strict';

  reconnectApp
    .factory('threadSvc', threadSvc);

  threadSvc.$inject = ['go','common'];

  function threadSvc(go,common) {
    var service = {
      deleteComment: deleteComment,
      updateComment: updateComment,
      getComments: getComments,
      saveHashTag: saveHashTag,
      addComment: addComment,
      updateLike: updateLike,
      addReply: addReply
    };

    return service;

    function getComments(siteUrl, postId) {
      var $select = '$select=__createdby_id,siteurl,timekeeper_id,__created,photo,name,editedcomment,relatedpostid,relatedcommentid,postcomment,id,likes,likes_displayname,likes_id';
      var q = $select + '&hso=__created ASC&hsf=@relatedpostid=' + postId + ' AND (siteurl=\'' + siteUrl + '\' OR siteurl=\'' + siteUrl.replace(/\/$/, "") + "')";

      return go
        .getHS('WCComments?' + q)
        .then(function (res) {
          var results = res.data.d.results;
          var length = results.length;
          var comments = [];
          var i;
          var y;

          if (length === 0) return;

          for (i = 0; i < length; i++) {
            results[i].hideReplyInputBox = true;
            results[i].hideEditInput = true;
            results[i].hideLikesCtn = false;
            results[i].limitToReplies = -1;
            results[i].inEditMode = false;
            results[i].replies = [];

            for (y = 0; y < length; y++) {
              if (results[i].id == results[y].relatedcommentid) {
                results[i].replies.push(results[y]);
              }
            }

            if (results[i].relatedcommentid == null) {
              comments.push(results[i]);
            }

          }

          return comments;

        });
    }

    function addComment(comment, siteurl, postid, user, tags) {
      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Comments\')/items';

      var data = {
        "__metadata": {
          'type': 'SP.Data.CommentsListItem'
        },
        "Title": "Post Comment",
        "CommenterPhotoUrl": user.photo,
        "relatedPostId": String(postid),
        "EditedComment": 'false',
        "PostComment": comment,
        "siteUrl": siteurl,
        "SourceSiteName": _spPageContextInfo.webTitle
      };
      if (tags.length > 0) saveHashTag(tags)
      return go
        .post(url, data)
        .then(function (res) {
          var commenterId = res.data.d.AuthorId;
          var relatedPostId = res.data.d.relatedPostId;
          var uniqueUrl = _spPageContextInfo.webAbsoluteUrl + '-Posts-' + relatedPostId + '-' + commenterId;
          return res;
        })
    }

    function updateComment(comment) {
      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Comments\')/items(' + comment.id + ')';

      var data = {
        "__metadata": {
          'type': 'SP.Data.CommentsListItem'
        },
        "Title": "Post Comment",
        "EditedComment": 'true',
        "PostComment": comment.postcomment,
      };

      return go
        .merge(url, data)
        .then(function (res) {

        });
    }

    function addReply(comment, siteurl, postid, relatedcommentid, user, tags) {
      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Comments\')/items';

      var data = {
        "__metadata": {
          'type': 'SP.Data.CommentsListItem'
        },
        "Title": "Post Reply",
        "RelatedCommentId": String(relatedcommentid),
        "CommenterPhotoUrl": user.photo,
        "relatedPostId": String(postid),
        "PostComment": comment,
        "EditedComment": 'false',
        "siteUrl": siteurl,
        "SourceSiteName": _spPageContextInfo.webTitle
      };

      saveHashTag(tags);

      return go
        .post(url, data)
        .then(function (res) {

        });
    }

    function updateLike(likeType, commentid, currentLikes) {
      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Comments\')/items(' + commentid + ')';
      var likerId = _spPageContextInfo.userId;

      if (likeType === 'Like') {

        if (currentLikes == null) {
          currentLikes = [String(likerId)]

        } else if (currentLikes != null) {
          currentLikes = currentLikes.split(';');
          currentLikes.push(likerId);

        }

      } else if (currentLikes != null) {

        currentLikes = currentLikes.split(';');
        currentLikes.forEach(function (liker, i) {
          if (liker == likerId) {
            currentLikes.splice(i, 1);
          }
        });

      }

      var data = {
        '__metadata': {
          'type': 'SP.Data.CommentsListItem'
        },
        'LikesId': {
          'results': currentLikes
        }
      };

      return go
        .merge(url, data)
        .then(function (data) {

        }, function (err) {

        });

    }

    function deleteComment(commentId) {
      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Comments\')/items(' + commentId + ')';

      return go
        .remove(url)
        .then(function (res) {});
    }

    /**
     * Adds new hashtags to the SharePoint list
     * @param {Array} tagstoSave  Array of tags
     * Returns the result.
     */
    function saveHashTag(tagstoSave) {
      if (!tagstoSave) return;
      if (typeof tagstoSave == "string") {
        try {
          tagstoSave = tagstoSave.split(";");
        } catch (error) {
          go.handleError(error);
        }
      }
      tagstoSave.forEach(function (tag) {
        //if (tag["status"] == "new") {
        if (!common.isNullOrWhitespace(tag)) {
          var title = (tag.hasOwnProperty("name")) ? tag.name : tag;
          // Add hashtag if not present
          title = (title.indexOf("#") == 0) ? title : "#" + title;
          var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Hashtags\')/items';
          var postData = {
            "__metadata": {
              'type': 'SP.Data.HashtagsListItem'
            },
            'Title': title
          }
          return go
            .post(url, postData)
            .then(function (res) {});
          // } else {
          //   return;
          // }
        }

      });

    }
  }
})();