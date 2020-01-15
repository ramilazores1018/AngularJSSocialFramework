(function () {
    'use strict';
  
    reconnectApp
      .directive("postHistory", postHistory);
  
      postHistory.$inject = [];
  
    function postHistory() {
      
        var directive = {
            templateUrl: "/_layouts/15/Connect/templates/post-history/post-history.html",
            restrict: 'E',
            scope: {},
            controller: PostHistoryCtrl,
            controllerAs: "historyvm"
        };  

      return directive;
    }
  
    PostHistoryCtrl.$inject = ["timezone", "common", "feedSvc", "postSvc"];
  
    // Post History Controller
    function PostHistoryCtrl(timezone, common, feedSvc, postSvc) {
        
        /**
         * Controller Variables
         */
        var historyvm = this;
        historyvm.showHistory = false;
        historyvm.showModifiedBy = false;
        historyvm.showSharedTo = false;
        historyvm.showSeeAll = false;
        historyvm.showSeeLess = false;
        historyvm.isLoading = false; //Disabled Post History for now.
        
        historyvm.post = {};

        historyvm.sharedTo = {};
        historyvm.sharedToAll = {};
        historyvm.sharedToLess = {};

        // Function Declarations
        historyvm.seeAll = seeAll;
        historyvm.seeLess = seeLess;

        /**
         * Function Definitions
         */
        function getSinglePost() {
            
            // Additional fields required
            var additionalSelect = "created,createdby_displayname";
            feedSvc.$select = feedSvc.$select + ',' + additionalSelect;
			
            return feedSvc.getSinglePost(common.getParameterByName('pID'), feedSvc.$select)
			.then(function (res) {
                
				if (!res && !res[0]) return;
				historyvm.post = res[0];
				
                historyvm.isLoading = false;
                
                if (common.getParameterByName('pID').length > 0) historyvm.showHistory = true;
				
				historyvm.created = timezone.getFormattedDateTime(historyvm.post.created, true, 'DD MMMM YYYY');
                historyvm.createdBy = historyvm.post.createdby_displayname;

                if (!common.isNullOrWhitespace(historyvm.post.postupdateddate)
                    && !common.isNullOrWhitespace(historyvm.post.postupdatedby_displaynam)) {
                        
                    historyvm.modified = timezone.getFormattedDateTime(historyvm.post.postupdateddate, true, 'DD MMMM YYYY');
                    historyvm.modifiedBy = historyvm.post.postupdatedby_displaynam;

                    // If there's a value for Post Updated Date and Post Updated By, then it has been modified.
                    historyvm.showModifiedBy = true;                    
                    
                    // However, if the Creator updated the Post on the same day, do not show the Modified By
                    if (historyvm.createdBy == historyvm.modifiedBy) {
                        if (historyvm.created == historyvm.modified) {
                            historyvm.showModifiedBy = (historyvm.post.ispostupdatedbyothers) ? true : false;
                        }
                    }
                }
            });
        }

        function getChildPosts() {
            
            return postSvc.getChildPosts(_spPageContextInfo.webAbsoluteUrl, common.getParameterByName('pID'))
			.then(function (res) {
                
                if (!res || res.length == 0) {
                    return;
                }

                // Sort the result by Created Date in descending order
                res = res.sort(function(a, b){
                    return moment(b.created) - moment(a.created);
                });

                historyvm.showSharedTo = true; 
                historyvm.showSeeAll = (res.length > 3) ? true : false;

                res.forEach(function(item, index) {                    
                    var childPost = {};
                    var postLink = item.parentwebfullurl + '/pages/post.aspx?pID=' + item.postid;
                    childPost.link = postLink;
                    childPost.title = item.parentwebtitle;
                    childPost.createdBy = item.createdby_displayname;
                    childPost.createdDate = timezone.getFormattedDateTime(item.created, true, 'DD MMMM YYYY');
                                        
                    historyvm.sharedToAll[index] = childPost;
                    if (index <= 2) {
                        historyvm.sharedTo[index] = childPost;
                    }

                });

            });
        }

        function seeAll() {
            historyvm.sharedToLess = historyvm.sharedTo;
            historyvm.sharedTo = historyvm.sharedToAll;
            historyvm.showSeeAll = false;
            historyvm.showSeeLess = true;
        }

        function seeLess() {
            historyvm.sharedTo = historyvm.sharedToLess;
            historyvm.showSeeAll = true;
            historyvm.showSeeLess = false;
        }

        function init() {
            getSinglePost();
            getChildPosts();
            
        }

        //init(); //Disabled Post History for now.

    }

}());