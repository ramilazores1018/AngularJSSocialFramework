(function () {
  'use strict';

  reconnectApp
    .factory('alertSvc', alertSvc);

  alertSvc.$inject = ['$q', 'go', 'socialDataSvc', 'common', 'pplSvc'];

  function alertSvc($q, go, socialDataSvc, common, pplSvc) {
    var subscribersListUrl = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Subscribers\')/items';
    var alertsListUrl = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Alerts\')/items';
    var alertMessages;
    var sender;

    var service = {
      getSubscribers: getSubscribers,
      unsubscribe: unsubscribe,
      subscribe: subscribe,
      alert: alert
    };

    window.sendAlert = alert;

    init();

    return service;

    // *  ====================================

    /**
     * 
     * @param {any} item Object that represents the item alerting on
     * @param {any} mentions Array of mention ID's from Item
     * @param {string} grouping Type of Alert (Post, Event, Task, Comment) 
     * @param {string} postAction Type of action that triggered alert (Like, Edit, Add)
     */
    function alert(item, grouping, postAction, webTitle) {
      var site;

      // SUBSCRIBE POSTER, METHOD RETURNS ALL SUBSCRIBERS FOR THE POST
      subscribe(item.Id, sender.sharepointid, postAction, item.siteUrl)
        .then(function (subscribers) {

          var co = ""; // Local content owner

          // If subscribers comes back empty assign it a blank array
          subscribers = subscribers !== undefined ? subscribers : [];
          var editor = item.EditorId || item.editorId;
          if (!item.MentionsId) item.MentionsId = [];
          var mentions = item.MentionsId.results !== null || item.MentionsId.results !== undefined ? item.MentionsId.results : [];
          var recipients = dedupeAlerts(subscribers, mentions, editor) //, grouping, postAction);
          var body;

          // MENTIONS
          if (recipients.mentions && recipients.mentions.length > 0) {
            recipients.mentions.forEach(function (recipient) {
              if (recipient == sender.sharepointid) return;
              body = buildDataObject(sender, recipient, item, grouping, postAction, 'mention', webTitle);
              createAlert(body);
            });
          }

          //  CONTENT OWNER
          if (recipients.contentOwner && recipients.contentOwner.length > 0 && postAction !== 'Add') {
            // recipients.contentOwner.forEach(function (recipient) {
            // DON"T FREAK OUT THE CONTENT OWNER
            co = recipients.contentOwner[0];
            if (co != _spPageContextInfo.userId) {
              body = buildDataObject(sender, co, item, grouping, postAction, 'contentowner', webTitle);
              createAlert(body);
            }
            // });
          }

          // SUBSCRIBERS
          // DO NOT NOTIFY SUBSCRIBERS WHEN POST IS LIKED
          if (recipients.subscribers && recipients.subscribers.length > 0 && postAction !== 'Add' && postAction !== "Edit") {
            recipients.subscribers.forEach(function (recipient) {
              // DO NOT NOTIFY CO AGAIN
              if (recipient != co) {
                // If current user is recipient, do not send alert as subscriber
                if (recipient == _spPageContextInfo.userId) return;
                body = buildDataObject(sender, recipient, item, grouping, postAction, 'subscriber', webTitle);
                createAlert(body);
              }
            });
          }
          //Alerts for assigned to task
          if (grouping=='Task') {

            body = buildDataObject(sender, item.AssignedToId, item, grouping, 'Assigned', 'assigned', webTitle);
                createAlert(body);
          }

        });
    }

    /**
     * Subscribes a user to the Subscribers list at the root site. Then returns
     * the list of subscribers for the requested post. 
     * 
     * @param postId {number} SharePoint Id of the post being subscribed to
     * @param userId {number} SharePoint Id of User subscribing
     * @param action {string} The action triggering Subscription
     */
    function subscribe(postId, userId, action, siteUrl) {
      if (action == "Like") {

        return getSubscribers(siteUrl, postId)
          .then(function (res) {
            return res;
          });

      }
      var siteUrl = siteUrl ? siteUrl : _spPageContextInfo.webAbsoluteUrl;

      if (siteUrl.lastIndexOf("/") == siteUrl.length -1)siteUrl=siteUrl.slice(0,siteUrl.length -1);

      var data = {
        '__metadata': {
          'type': 'SP.Data.SubscribersListItem'
        },
        Title: siteUrl + '-' + postId + '-' + userId,
        ReConnUrl: siteUrl,
        SubscriberId: userId || _spPageContextInfo.userId,
        UserId: String(userId) || String(_spPageContextInfo.userId),
        Action: action || 'post_subscriber',
        ItemId: String(postId),
        ListName: 'Posts'
      };

      return go
        .post(subscribersListUrl, data)
        .then(function () {
          return getSubscribers(siteUrl, postId)
            .then(function (res) {
              return res;
            });
        })
        .catch(function (err) {

          if (!err.status == 500) {
            console.error(err);
          }
          return getSubscribers(siteUrl, postId)
            .then(function (res) {
              return res;
            });
        });
     
    }

    // NEED TO GET ITEM FROM SHAREPOINT AND DELETE. USE THE SAME FILTERS
    function unsubscribe(postId) {
      var query = '?$select=Subscriber/Id,ID&$expand=Subscriber/Id&$filter=(ItemId eq ' + postId + ') and (Subscriber/Id eq ' + _spPageContextInfo.userId + ')';
      var getUrl = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Subscribers\')/items' + query;

      return go
        .get(getUrl)
        .then(function (res) {
          var results = res.data.d.results[0];
          return results.ID;

        })
        .then(function (id) {

          var removeUrl = _spPageContextInfo.siteAbsoluteUrl + '/_api/web/lists/getByTitle(\'Subscribers\')/items(' + id + ')';

          go
            .remove(removeUrl);

        })
    }

    /**
     * Create Alert items in the Alerts list at the root Site. The Title is built
     * using the Alert Messages list at the root site. 
     * 
     * @param messageType {string} Post, Event, Task, Comment (Must Match Alert Messages List)
     * @param action {string} Alert Message Action (Actions listed in Alert Messages List)
     * @param sender {object} Sender Object (Id, Display Name)
     * @param message {string} Digest of Post
     * @param link {string} Link to Post
     * @param userId {number} SharePoint Id of User being Alerted
     */

    function sendMobilePushNotification(spID, title, linkURL, alertIDVal) {
      var empID = "";

      pplSvc.getUserById(spID, false)
        .then(
          function (resProfile) {

            empID = resProfile.employeeid;

            var q = {
              web: "WCAlerts?",
              hsf: "hsf=@user_id=" + spID + " and seen=false",
              select: "$select=*",
              hso: "hso=__Created Desc"
            };

            var URLRequest = encodeURI(
              q.web + q.select + "&" + q.hso + "&" + q.hsf
            );

            go.detectHSEnv();

            go
              .getHS(URLRequest)
              .then(
                function (res) {

                  var dataValue = res.data.d.results;

                  var totalBadge = dataValue.length + 1;

                  //saki account
                  //var urlPush = "http://am1apwb910:2169/api/sendNotification?employeeId=116570&badgeCount="+  dataValue.length +"&alertMsg="+ title +"&targetURL="+ linkURL +"&badgeAlertID="+ alertIDVal;
                  //Paul account
                  //var urlPush = "http://am1apwb910:2169/api/sendNotification?employeeId=130298&badgeCount="+  dataValue.length +"&alertMsg="+ title +"&targetURL="+ linkURL +"&badgeAlertID="+ alertIDVal;
                  //Final code
                  //var urlPush = "http://am1apwb910:2169/api/sendNotification?employeeId=" + empID + "&badgeCount=" + dataValue.length + "&alertMsg=" + title + "&targetURL=" + linkURL + "&badgeAlertID=" + alertIDVal;

                  var urlPush = "http://ConnectMobileAPN/api/SendNotification?employeeId=" + empID + "&badgeCount=" + totalBadge + "&alertMsg=" + title + "&targetURL=" + linkURL + "&badgeAlertID=" + alertIDVal;

                  $.get(urlPush, function (data, status) {

                  });

                });

          });

    }

    function createAlert(dataObj) {

      var alertIDValue = "";
      var empID = dataObj.UserId;
      var alertTitle = dataObj.Title;
      var alertURL = dataObj.Link;

      return go
        .post(alertsListUrl, dataObj)
        .then(function (res) {

          alertIDValue = res.data.d.ID;
          sendMobilePushNotification(empID, alertTitle, alertURL, alertIDValue);

        });

    }

    // * Helper Functions ====================================

    function getSubscribers(siteUrl, itemId) {
      // ADD SLASH TO END OF SITEURL IF MISSING.
      // THIS IS REQUIRED SINCE SITEURL IS STORED WITH A TRAILING SLASH IN HANDSHAKE.
      if (siteUrl.lastIndexOf("/") != siteUrl.length - 1) siteUrl = siteUrl + "/";


      var hsf = "&hsf=@itemId=" + itemId + " AND siteurl=" + siteUrl // + " OR " + "siteurl=http://connect.whitecase.com/)"
      return go
        .getHS('WCSubscribers?$select=subscriber_id,action,subscriber_displayname,siteurl' + hsf)
        .then(function (res) {
          // DUPLICATE USERS CAN EXIST IN OUR RESULTSET PRIOR TO THE FIX IF THEY SUBSCRIBED WHILE ON THE HOMEPAGE AND ON THE SPECIFIC SITE
          var subscribers = res.data.d.results;
          subscribers = _.uniq(subscribers, function (user) {
            return [user.subscriber_id, user.action].join();
          })
          return subscribers;
        });

    }

    function buildDataObject(sender, userId, item, grouping, postaction, recipient, webTitle) {
      var SourceSiteURL = "";
      var Link = "";
      if (item.siteUrl) {
        SourceSiteURL = item.siteUrl;
        if (postaction !== "Share") {
          Link = item.siteUrl + '/pages/post.aspx?pID=' + item.Id;
        } else {
          Link = item.siteUrl;
          SourceSiteURL = _spPageContextInfo.webAbsoluteUrl;
        }
        if (item.siteUrl.lastIndexOf("/") == item.siteUrl.length - 1) {
          // Remove last slash
          SourceSiteURL = item.siteUrl.slice(0, item.siteUrl.length - 1);
        }
      }

      var msg = alertMessages[grouping][postaction][recipient][0].message;
      var dataObj = {
        __metadata: {
          'type': 'SP.Data.AlertsListItem'
        },
        Title: sender.name + ' ' + msg,
        SourceSiteURL: SourceSiteURL,
        SourceSiteName: webTitle || _spPageContextInfo.webTitle,
        // SourceUserName: String(sender.sharepointid),
        SourceUserName: String(sender.name),
        AlertType: grouping,
        Message: decodeURI(item.PostDigest),
        UserId: userId,
        Link: Link,
        PostId: String(item.Id)
      };

      return dataObj;

    }

    function dedupeAlerts(subscribersArr, mentionsArr, contentOwner) {

      var messages = {
          contentOwner: [],
          subscribers: [],
          mentions: []
      };

    removeContentOwner(subscribersArr);
    dedupeMentions(mentionsArr, contentOwner);

      // RETURN ARRAY OF USERS TO ALERT. THIS ARRAY IS A DEDUPED LIST OF USERS
      // THAT NEED TO BE ALERTED
      
      return messages;

      function removeContentOwner(subArr) {

          subArr.forEach(function (sub, i) {
              if (sub.action == 'Content Owner') {
                  messages.contentOwner.push(sub.subscriber_id)
                return;
              }

              messages.subscribers.push(sub.subscriber_id);
          });
        
      }


      function dedupeMentions(mentionsArr, contentOwner) {
          if (!mentionsArr) return;
          mentionsArr.forEach(function (mention) {
              if (mention == contentOwner) {
                  messages.contentOwner = [];
              }

              messages.mentions.push(mention);
          });

      }


  }


    function flatten(arr, field) {
      var result = [];

      arr.forEach(function (item) {

        if (item.action === 'Content Owner') {
          item.sendAlert = true;
          flatArr.owner.push(item);
        }

        result.push(item[field]);

      })

      return result;
    }

    function init() {

      // Get Alert Messages
      socialDataSvc
        .getAlertMessages()
        .then(function (res) {
          alertMessages = res;
        });

      // Get Current User Data 
      socialDataSvc
        .getCurrentUser()
        .then(function (res) {
          sender = res;
        });

    }

  }

})();