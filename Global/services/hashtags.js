(function () {
  angular.element('body').on('click', function (e) {
    //only buttons
    if ($(e.target).data('toggle') !== 'popover' &&
      $(e.target).parents('.popover.in').length === 0 &&
      $('[data-toggle="popover"]').popover) {
      $('[data-toggle="popover"]').popover('hide');
    }

    $('[data-toggle="popover"]').each(function () {
      //the 'is' for buttons that trigger popups
      //the 'has' for icons within a button that triggers a popup
      if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
        $(this).popover('hide');
      }
    });
  });
})();

(function () {

  'use strict';

  String.prototype.replaceAt = function (index, charToReplace, replaceWith) {
    if (this.indexOf(charToReplace) == 0) {
      return this.substr(0, index) + replaceWith + this.substr(index + charToReplace.length);
    }
    return;
  }

  reconnectApp
    .factory('hashtags', hashtags)

  hashtags.$inject = ['go', 'common'];
  /** @ngInject */

  function hashtags(go, common) {

    var service = {
      processDigestForHashtags: processDigestForHashtags,
      getHashtags: getHashtags,
      getHashtagValues: getHashtagValues,
      followHashtag: followHashtag,
      unfollowHashtag: unfollowHashtag
    }

    var allFollowedTags;

    function stripHashtag(tag) {
      return tag.replace('%23', '').replace('#', '');
    }

    function followHashtag(tag, userid) {

      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Following\')/items';
      var data = {
        '__metadata': {
          'type': 'SP.Data.FollowingListItem'
        },
        'Follow_x0020_Type': 'Tag',
        'Link': _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?hashtag=' + encodeURIComponent(tag),
        'UserId': userid,
        'Title': "#" + tag
      };

      return go
        .post(url, data)
        .then(function (res) {
          var tag = res.data.d.Title;

          var allSitesLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?allsites=true&hashtag=' + encodeURIComponent(tag);
          var thisSiteLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?site="' + _spPageContextInfo.webAbsoluteUrl + '"&hashtag=' + encodeURIComponent(tag);

          tag = stripHashtag(tag);

          var html = "<div class='wc-post-hashtags'>" +
            '<div class="hashtag-menu-item" onclick="wc.unFollowHashtag(\'' + tag + '\')"><a >Unfollow ' + tag + '</a></div>' +
            "<div class='hashtag-menu-item'><a href='" + thisSiteLink + "'>Filter #" + tag + " on this site</a></div>" +
            "<div class='hashtag-menu-item'><a href='" + allSitesLink + "'>Filter #" + tag + " tag on all sites</a></div>" +
            "</div>";

          $("." + tag).attr('data-content', html);
          // $("#" + tag).popover('hide');
          $('[data-toggle="popover"]').popover('hide');

        });

    }

    function unfollowHashtag(unfollowTag, followedTags) {
      var id;
      var tag = stripHashtag(unfollowTag);
      tag = '#' + unfollowTag;

      followedTags.forEach(function (currentTag) {
        if (currentTag.linktitle == tag) {
          id = currentTag.id;
        }
      });

      var url = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Following\')/items(' + id + ')';

      return go
        .remove(url)
        .then(function (res) {
          // var tag = unfollowTag;

          var allSitesLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?allsites=true&hashtag=' + encodeURIComponent(tag);
          var thisSiteLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?site="' + _spPageContextInfo.webAbsoluteUrl + '"&hashtag=' + encodeURIComponent(tag);
          tag = stripHashtag(tag);
          var html = "<div class='wc-post-hashtags'>" +
            '<div class="hashtag-menu-item" onclick="wc.followHashtag(\'' + tag + '\')"><a >Follow #' + tag + '</a></div>' +
            "<div class='hashtag-menu-item'><a href='" + thisSiteLink + "'>Filter #" + tag + " on this site</a></div>" +
            "<div class='hashtag-menu-item'><a href='" + allSitesLink + "'>Filter #" + tag + " tag on all sites</a></div>" +
            "</div>";

          $("." + tag).attr('data-content', html);
          // $("#" + tag).popover('hide');
          $('[data-toggle="popover"]').popover('hide');

        });
    }

    /**
     *Swap quotes and quotations with their entity characters
     *
     * @param {*} str
     * @returns
     */
    function encodedStr(str) {
      return str.replace(/[\'"]/gim, function (i) {
        return '&#' + i.charCodeAt(0) + ';';
      })
    }

    function compileHashtagsAsPopovers(hashtags, followedTags, sourceSite) {

      if (hashtags.length > 0) {
        var hashtagAction = "";
        var allSitesLink = "";
        var thisSiteLink = "";
        var html = "";
        var tagName = "";
        var tags = [];
        var hashtag = "";
        var span;

        angular.forEach(hashtags, function (tag, idx, obj) {
          span = document.createElement("span");
          tagName = tag.innerText;
          tagName = tagName.replace('#', '')
          encodeURIComponent(tagName)
          tagName = "#" + tagName
          allSitesLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?allsites=true&hashtag=' + tagName.replaceAt(0, '#', '%23'); // encodeURIComponent(tagName);
          //thisSiteLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?site="' + _spPageContextInfo.webAbsoluteUrl + '"&hashtag=' + tagName.replaceAt(0, '#', '%23'); // ;
          thisSiteLink = _spPageContextInfo.siteAbsoluteUrl + '/pages/tags.aspx?site="' + sourceSite + '"&hashtag=' + tagName.replaceAt(0, '#', '%23');

          hashtag = "'" + tagName.replace('#', '') + "'";
          // hashtag = encodedStr(hashtag);

          if (isTagFollowed(tagName, followedTags)) {
            hashtagAction = '<div class="hashtag-menu-item" onclick="wc.unFollowHashtag(' + hashtag + ')"><a >Unfollow ' + tagName + '</a></div>';

          } else {
            hashtagAction = '<div class="hashtag-menu-item" onclick="wc.followHashtag(' + hashtag + ')"><a >Follow ' + tagName + '</a></div>';

          }

          html = "<div class='wc-post-hashtags'>" +
            hashtagAction +
            "<div class='hashtag-menu-item'><a href='" + thisSiteLink + "'>Filter " + tagName + " on this site</a></div>" +
            "<div class='hashtag-menu-item'><a href='" + allSitesLink + "'>Filter " + tagName + " tag on all sites</a></div>" +
            "</div>";

          var elm = '<a tabindex="0" ' +
            'class="' + tagName.replace('#', '') + '" ' +
            'data-id="tag" ' +
            'id="' + tagName.replace('#', '') + '" ' +
            'data-html="true" ' +
            'data-toggle="popover" ' +
            'data-trigger="click" ' +
            'style="cursor:pointer;"></a>';

          span.innerHTML = elm;

          $(span).find('a').html(tagName).attr("data-content", html);

          tags.push(span);

        });

        return tags;

      } else {
        return;

      }
    }

    function isTagFollowed(currentTag, followedTags) {
      var result = false;
      if (typeof followedTags == "string" && followedTags != "" && followedTags != "[]") {
        followedTags = JSON.parse(followedTags);
      }
      if ((followedTags) && (common.isArray(followedTags))) {
        followedTags.forEach(function (tag) {
          if (tag.linktitle == currentTag) {
            result = true;
          }
        });
      }
      return result;

    }

    function processDigestForHashtags(digest, followedTags, sourceSite) {
      // Handling Hashtags
      if (!digest) return;
      var compiledHashtags = {};
      var unwrapped = false;
      var hashtags;

      allFollowedTags = followedTags;

      var localDiv = setupElement(digest);
      hashtags = getHashtags(digest);
      if (hashtags.length > 0) {
        compiledHashtags = compileHashtagsAsPopovers(hashtags, followedTags, sourceSite);
        angular.element(localDiv).find(".hashtag").replaceWith(function (i) {
          return compiledHashtags[i];
        });

        return (unwrapped) ? $sce.trustAsHtml(localDiv.innerHTML) : localDiv.innerHTML;

      } else {
        return digest;

      }
    }

    function setupElement(digest) {
      var localDiv = {};
      var post = "";
      if (typeof digest == "object") {
        post = digest.$$unwrapTrustedValue();
        unwrapped = true;
      } else {
        post = digest;
      }
      localDiv = document.createElement("div");
      localDiv.innerHTML = post;
      return localDiv;
    }

    function getHashtags(digest, getValues) {
      if (!digest) return;
      var localDiv = {};
      var hashtags = {};
      localDiv = setupElement(digest);
      hashtags = angular.element(localDiv).find(".hashtag");
      hashtags = (getValues) ? angular.element(localDiv).find(".hashtag").text() : angular.element(localDiv).find(".hashtag");
      return hashtags;
    }

    function getHashtagValues(digest) {

      // Per User Story 1223, users should be able to save blank digest when sharing a post.
      if (digest == '' || !digest) return '';

      var hashtagValues = getHashtags(digest, true);
      // NEED TO INJECT SEMICOLONS;
      var lastTagPos = hashtagValues.lastIndexOf("#");
      hashtagValues = hashtagValues.split("#");

      for (var i = 1; i < hashtagValues.length; i++) {
        hashtagValues[i] = "#" + hashtagValues[i] + ";";
      }

      return hashtagValues.join("")
    }

    // String.prototype.splice = function (idx, rem, str) {
    //     return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
    //   };

    //   String.prototype.replaceAll = function(search, replacement) {
    //     var target = this;
    //     return target.replace(new RegExp(search, 'g'), replacement);
    // };

    return service;
  }

}());