
(function () {
  'use strict';

  reconnectApp
    .factory('mentionsSvc', mentionsSvc);

  /** @ngInject */
  mentionsSvc.$inject = ['common'];

  function mentionsSvc(common) {

    var service = {
      getMentions: getMentions,
      getMentionValues: getMentionValues
    }

    function getMentions(digest, getValues) {
      if (!digest) return;
      var localDiv = {};
      var mentions;
      localDiv = setupElement(digest);
      if (getValues) {
        mentions = [];
        angular.element(localDiv).find(".mention").each(function () {
          mentions.push(Number($(this).attr("data-userid")));
        });
      } else {
        mentions = "";
        mentions = angular.element(localDiv).find(".mention");
      }
      return mentions;
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

    function getMentionValues(digest) {
      var mentionValues = getMentions(digest, true);
      // NEED TO INJECT SEMICOLONS;
      //     var lastTagPos = mentionValues.lastIndexOf("@");
      //     mentionValues = mentionValues.split("@");

      //     for (var i = 1; i < mentionValues.length; i++) {
      //         mentionValues[i] = "@" + mentionValues[i] + ";";
      //     }

      //   return mentionValues.join("")
    //   if (common.isArray(mentionValues)) {
    //       var mentionValuesAsString = mentionValues.join(";") + ";";
    //     return mentionValuesAsString;
    //   }
      return mentionValues;
    }

    return service;
  }

}());