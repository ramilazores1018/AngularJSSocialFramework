(function () {
  'use strict';
  ExecuteOrDelayUntilScriptLoaded(function () {
    var scriptbase = _spPageContextInfo.siteAbsoluteUrl + "/_layouts/15/";
    // Load the js files and continue to the successHandler
    $.getScript(scriptbase + "SP.RequestExecutor.js", function () {});
  }, "sp.js");
  reconnectApp
    .directive('inputDirective', inputDirective)
    .controller('iInputController', iInputController);

  inputDirective.$inject = ['$compile'];

  function inputDirective($compile) {

    function link(scope, element, attributes) {
      var el = $('<wc-dialog dialog-title="Upload File"></wc-dialog>');
      var dialogTemplate = $compile(el)(scope);
      // var content = dialogTemplate
      angular.element(element).append(dialogTemplate);

    }

    var directive = {
      controller: 'iInputController',
      controllerAs: 'inputvm',
      link: link,
      restrict: 'EA',
      scope: {
        inputMode: '@', // New or Edit
        inputType: '@', // Post, Event, Task
        inputPostId: '@',
        showPlaceholder: '@', // True / False to default to this
        showEvent: '@', // True / False to show/hide this tab
        showTask: '@', // True / False to show/hide this tab
        showPost: '@' // True / False to show/hide this tab
      },
      templateUrl: '/_layouts/15/Connect/templates/Input/interactive-input.html'
    };

    return directive;
  }

  iInputController.$inject = ['$timeout', '$scope', '$q', '$sce', 'interactiveInputSvc', 'socialDataSvc', 'go', 'tinymceSvc', '$rootScope', 'common', 'threadSvc', 'alertSvc', 'hashtags', 'timezone', 'mentionsSvc', 'postSvc'];

  function iInputController($timeout, $scope, $q, $sce, interactiveInputSvc, socialDataSvc, go, tinymceSvc, $rootScope, common, threadSvc, alertSvc, hashtags, timezone, mentionsSvc, postSvc) {
    var inputvm = this;
    // * INPUT FORM METHODS
    inputvm.isHomePage = _spPageContextInfo.webServerRelativeUrl === '/';
    inputvm.savePublishedPostData = savePublishedPostData;
    inputvm.showCalPublishedDate = showCalPublishedDate;

    inputvm.showCompletedDate = showCompletedDate;


    inputvm.resetRequiredFields = resetRequiredFields;
    inputvm.showAdvancedOptions = showAdvancedOptions;
    inputvm.saveDraftPostData = saveDraftPostData;
    inputvm.showMicroPostForm = showMicroPostForm;
    inputvm.showCalStartDate = showCalStartDate;
    inputvm.openInitialForm = openInitialForm;
    inputvm.showPlaceholder = showPlaceholder;
    inputvm.toggleActiveTab = toggleActiveTab;
    inputvm.showCalEndDate = showCalEndDate;
    inputvm.showCalDueDate = showCalDueDate;
    inputvm.showEventForm = showEventForm;
    inputvm.setTaskStatus = setTaskStatus;
    inputvm.savePostData = savePostData;
    inputvm.showTaskForm = showTaskForm;
    inputvm.deletePost = deletePost;
    inputvm.openDigest = openDigest;
    inputvm.showInput = showInput;
    inputvm.cancel = cancel;
    inputvm.onClickPinPost = onClickPinPost;

    // * INPUT FORM PROPERTIES
    inputvm.showUploadImageControl;
    inputvm.showUploadFileControl;
    inputvm.hideAdvancedOptions;
    inputvm.taskCompletedDate;
    inputvm.redirectNewWindow;
    inputvm.allowInteractive;
    inputvm.showSharedTitle;
    inputvm.isAdvancedPost;
    inputvm.isValidFields;
    inputvm.publishedDate;
    inputvm.categories;
    inputvm.contentOwner;
    inputvm.showToaster;
    inputvm.taskDueDate;
    inputvm.redirectUrl;
    inputvm.eventClass;
    inputvm.loadedTiny;
    inputvm.placeholder;
    inputvm.postStatus;
    inputvm.showOnSite;
    inputvm.postClass;
    inputvm.taskClass;
    inputvm.dtDueDate;
    inputvm.startDate;
    inputvm.userPhoto;
    inputvm.postData;
    inputvm.postType;
    inputvm.creating;
    inputvm.editMode;
    inputvm.endDate;

    inputvm.completedDate;


    inputvm.digest;
    inputvm.matter;
    inputvm.client;
    inputvm.title;
    inputvm.pID;
    inputvm.postObj;
    inputvm.followedCM;
    inputvm.mattersTab;
    inputvm.pinnedPost;
    inputvm.showPinPost;
    inputvm.overridePinnedPost;

    /*==========================
    * SHOW FORM FLAGS
     These flags control whether a
     view is displayed on the page.
    ==========================*/
    inputvm.showForm = {
      placeholder: true,
      micropost: false,
      fullpost: false,
      event: false,
      task: false
    };
    /*==========================
    * FORM FLAGS
      These flags control error messages
      in the view. If set to false it
      will show error message in view.
    ==========================*/
    inputvm.isValid = {
      redirectNewWindow: true,
      includeOnHomepage: true,
      allowInteractive: true,
      publishedDate: true,
      contentOwner: true,
      keyContacts: true,
      redirectUrl: true,
      categories: true,
      digest: true,
      images: true,
      status: true,
      title: true,
      files: true
    };

    /************
    Default tabs to show.
    By default, post and events are enabled.
    */
    inputvm.showTab = {
      post: true,
      event: true,
      task: false,
      milestone: false
    }

    inputvm.dptaskstatusName = {
      id: "1",
      name: "Not Started"
    };

    inputvm.taskstatusItems = [{
        id: "1",
        name: "Not Started"
      },
      {
        id: "2",
        name: "In Progress"
      },
      {
        id: "3",
        name: "Completed"
      }
    ];


    var currentUser;
    var taskStatus;

    // MAGIC SUGGEST OBJECTS
    var msContentOwner = null;
    var msKeyContacts = null;
    var msCategories = null;
    var msAssignedTo = null;
    var msClientMatter = null;
    var userData = ""; // List of active users for Magic Suggest

    // FLAT PICKER OBJECTS
    var dtEventStart;
    var dtEventEnd;

    var dtCompleted

    var dtDueDate;
    var dtPublishedDate;

    /**
     * Init function:
     * Reset required fields
     */
    function init() {

      setTitlePlaceholder();

      inputvm.hideAdvancedOptions = false;

      if (window.location.href.indexOf('leader-training') >= 0 && $scope.inputType == 'Task') {
        inputvm.hideAdvancedOptions = true;
      }

      inputvm.editMode = false;
      inputvm.isHomePage = _spPageContextInfo.webServerRelativeUrl == '/';
      inputvm.creating = true; //spinner
      inputvm.showInputForm = showInput();
      inputvm.allowInteractive = true;
      inputvm.showOnSite = true;
      inputvm.pinnedPost = false;
      inputvm.userPhoto = '';
      inputvm.isValidFields = true;
      inputvm.showSharedTitle = false;

      inputvm.postObj = {};

      // Set form Defaults
      resetRequiredFields();

      // EDIT MODE
      $scope.$on('editPost', function (ev, data) {
        cancel();
        processInput()
          .then(function () {
            handleEditmode(data);
          });

      });

      // Key function call
      processInput();

      if ($scope.inputType == "Event") inputvm.postType = "Event";
      if ($scope.inputType == "Task") inputvm.postType = "Task";
      if ($scope.inputType = "Post") inputvm.postType = "Post";

      $scope.inputvm.toggleActiveTab(inputvm.postType);

      if ($scope.showEvent) {
        showEventForm();
      } else if ($scope.showTask) {
        showTaskForm();
      } else if ($scope.showPost) {
        showMicroPostForm();
      } else if ($scope.showPlaceholder) {
        showPlaceholder();
      } else {
        showPlaceholder();
      }

      toggleShowTabs();

      // Get Site Editors
      common.getSiteEditors();

    }

    function handleMatters() {

      inputvm.isMatters = common.isMatters();
      inputvm.mattersTab = common.getParameterByName('tab').toLowerCase() || '';
      if (inputvm.isMatters) {
        //matterSvc.getFollowedMatters()
        interactiveInputSvc.getFollowedMatters()
          .then(function (results) {
            if (Array.isArray(results) && results.length > 0) {
              var followedCM = [];
              results.forEach(function (cm, idx) {
                cm.name = cm.title;
                cm.id = cm.client + "-" + cm.matter;
                followedCM.push(cm);
              });
              inputvm.followedCM = followedCM;
              initmsClientMatter(followedCM)
                .then(function (ms) {
                  msClientMatter = ms;
                  msClientMatter.enable();
                  angular.element(msClientMatter).on('selectionchange', function (e, m) {
                    inputvm.clientmatters = this.getValue()[0];
                  });
                });
              if (inputvm.mattersTab == "landing") {
                // USER IS ON THE LANDING PAGE. HIDE ADVANCED OPTIONS. INCLUDING THE TOGGLE.
                inputvm.hideAdvancedOptions = true;

                // HIDE DRAFT BUTTON ON MATTERS LADNING TAB
                // US: 2895
                showDraftButton(false);

                // FORCE THE OTHER FORM TABS TO HIDE
                showEventTab(false);
                showTaskTab(false);
              }
            }

          });
      }
    }

    function setTitlePlaceholder() {
      inputvm.placeholder = (inputvm.postType == 'Task' || inputvm.postType == 'Event') ? "Title" : "Title (Optional)";
    }

    function processInput() {
      return socialDataSvc
        .getCurrentUser(_spPageContextInfo.userId)
        .then(function (user) {
          if (user) {
            currentUser = user;
            inputvm.userPhoto = user.photo || "http://connectstatic.whitecase.com/photos/nophoto.jpg";
            return socialDataSvc.getAllUsers();
          } else {
            go.handleError(user);
          }
        })
        .then(function gotAllUsers(users) {
          userData = users;
          return LoadAdvancedData(users)
        })
        .then(function resultsLoadedAdvancedData() {
          if (tinymce.activeEditor && tinymce.activeEditor.id == "input-digest") return tinymce.activeEditor;
          return openDigest(); // OPEN TINY
        })
        .then(function openDigestSuccess(res) {
          // ASSIGN TINY MCE EDITOR INSTANCE
          if (res) {
            try {
              handleMatters();
              inputvm.loadedTiny = res[0] || res;
              inputvm.creating = false;
              // CHECK URL FOR EDIT/NEW PARAMETERS
              //var edit = (common.getParameterByName('mode').toLowerCase() == "edit") ? true : false;
              (common.getParameterByName('mode').toLowerCase() == "edit") ? inputvm.editMode = true: null;
              inputvm.pID = common.getParameterByName('pID') || $scope.inputPostId;

              if ((inputvm.editMode) && (inputvm.pID)) {

                $rootScope.$broadcast('hideFilterControlOnEditMode');

                if ((inputvm.pID !== "") && (inputvm.pID !== undefined)) {

                  interactiveInputSvc.getPost(inputvm.pID)
                    .then(function goGetSuccess(result) {
                      if (result) {
                        var post = result[0]
                        if (post.shareData || post.parentpostsubweb) {
                          // POST HAS A SHARE
                          postSvc
                            .getPostsForShares(post)
                            .then(function (res) {
                              post["shareData"] = res;
                              handleEditmode(post);
                            });
                        } else {
                          handleEditmode(result[0]);
                        }

                      }
                    })
                    .catch(function fail(err) {
                      go.handleError(err);
                    });
                }
              } else if (common.getParameterByName('mode') === 'new') {
                switch (common.getParameterByName('form')) {
                  case 'event':
                    showEventForm();
                    break;
                  case 'task':
                    showTaskForm();
                    break;
                  default:
                    showMicroPostForm();
                    break;
                }
              }

              initTaskFields();
              setFocus();
              return initmsCategories();

            } catch (err) {
              go.handleError(err);
            } // **** END TRY CATCH *******
          } else {
            // Handle Service accounts
            // go.handleError(res);
          }
        })
        .then(function getCategoriesSuccess(data) {
          msCategories = data;
        })
        .catch(function openDigestFail(err) {
          go.handleError(err);
        });
    }

    function showInput(isEditMode) {
      var isHomePage = _spPageContextInfo.webServerRelativeUrl == '/';
      var isSinglePost = common.checkIfSinglePostView();

      if (!isEditMode) {

        if (isSinglePost || isHomePage) return false;

        return true;

      } else if (isEditMode) {
        return true;
      }
    }

    function handleEditmode(res) {

      var result;
      if (res.hasOwnProperty('data')) {
        result = res.data.d;
      } else {
        result = res;
      }
      inputvm.postObj = result;
      resetRequiredFields();
      inputvm.showInputForm = showInput(true);
      inputvm.editMode = true;
      if (!inputvm.loadedTiny) {
        inputvm.openDigest()
          .then(function tinyIsOpen(tiny) {
            inputvm.loadedTiny = tiny[0];
            assignFieldValues(result);
          })
      } else {
        assignFieldValues(result);
      }
      toggleShowTabs();
      $rootScope.$broadcast('hidePostOnEditMode');

    }

    function showDraftButton(force) {
      if (!inputvm.editMode || inputvm.postStatus === 'Draft') inputvm.showDraftBtn = true;
      (!common.isNullOrWhitespace(force)) ? inputvm.showDraftBtn = force: null;
    }

    function openInitialForm() {
      showDraftButton();
      handleMatters();
      showMicroPostForm();
    }

    function setupCategoryOptions(data) {
      var options = {
        allowDuplicates: true,
        id: '#input-categories',
        icon: 'fa fa-folder',
        placeholder: 'Add Categories',
        data: data,
        cls: 'ms-custom-class'
      }
      if (!data || data.length == 0 || data == "[]") {
        // Handle no data
        options["placeholder"] = "There are no categories defined for this site. ";
        options["allowFreeEntries"] = false;
        options["disabled"] = true;
        options["data"] = {};
        options["cls"] = 'noCategories';
        options["style"] = 'width:100%!important';
        // $(options.id + " input").style('width', '100%', 'important');
        $(options.id + " input").css('width', 'inherit');
      }
      return options;
    }



    function setFocus() {
      // Attempt to set focus on first input box
      $timeout(function () {
        angular.element("#input-title").focus();
      }, 250)
    }

    function toggleShowTabs() {
      showMilestoneTab();
      showEventTab();
      showTaskTab();
      showPostTab();
    }

    function showMilestoneTab(force) {
      if (inputvm.isMatters && (inputvm.postType == 'Event' || inputvm.editMode == false)) {
        inputvm.showTab.milestone = false;
      } else if (inputvm.postType == 'Milestone') {
        inputvm.showTab.milestone = true;
      } else if (inputvm.editMode) {
        inputvm.showTab.milestone = false;
      } else {
        inputvm.showTab.milestone = false;
      }
      (!common.isNullOrWhitespace(force)) ? inputvm.showTab.milestone = force: null;
    }

    function showEventTab(force) {
      if (inputvm.isMatters) {
        inputvm.showTab.event = false;
      } else if (inputvm.postType == 'Event') {
        inputvm.showTab.event = true;
      } else if (inputvm.editMode) {
        inputvm.showTab.event = false;
      }
      // else if (inputvm.postType) {
      //   inputvm.showTab.event = false;
      // } 
      else {
        inputvm.showTab.event = true;
      }
      (!common.isNullOrWhitespace(force)) ? inputvm.showTab.event = force: null;
    }


    //place where to show task tab
    function showTaskTab(force) {
      if (inputvm.postType == 'Task') {
        inputvm.showTab.task = true;
      } else if (inputvm.editMode) {
        inputvm.showTab.task = false;
      } else if (window.location.href.indexOf("opportunitymanagement") >= 0) {
        inputvm.showTab.task = true;
      } else if (window.location.href.indexOf("leader-training") >= 0) {
        inputvm.showTab.task = true;
      }
      // else if (inputvm.postType) {
      //   inputvm.showTab.task = false;
      // } 
      else {
        inputvm.showTab.task = false;
      }
      (!common.isNullOrWhitespace(force)) ? inputvm.showTab.task = force: null;
    }

    function showPostTab() {
      if (inputvm.postType == 'Post') {
        inputvm.showTab.post = true;
      } else if (inputvm.editMode) {
        inputvm.showTab.post = false;
      }
      // else if (inputvm.postType) {
      //   inputvm.showTab.post = false;
      // } 
      else {
        inputvm.showTab.post = true;
      }
    }

    function showPlaceholder() {
      // Explicitly Hide creating Form Spinner
      setTitlePlaceholder();
      inputvm.creating = false;
      (inputvm.loadedTiny) ? inputvm.loadedTiny.setContent(''): null;
      inputvm.showForm.micropost = false;
      inputvm.showForm.fullpost = false;
      inputvm.showForm.event = false;
      inputvm.showForm.task = false;
      inputvm.showForm.placeholder = true;

    }

    function showMicroPostForm() {
      // Explicitly Hide creating Form Spinner
      setTitlePlaceholder();
      inputvm.creating = false;
      inputvm.resetRequiredFields();
      toggleActiveTab('Post');
      inputvm.showForm.micropost = true;
      inputvm.showForm.placeholder = false;
      inputvm.showForm.fullpost = false;
      inputvm.showForm.event = false;
      inputvm.showForm.task = false;
      inputvm.postStatus = 'Published';
      inputvm.isValidFields = true;
      setFocus();
    }

    function showTaskForm() {
      // Explicitly Hide creating Form Spinner
      inputvm.creating = false;
      setTitlePlaceholder();
      inputvm.showTab.task = true;
      inputvm.resetRequiredFields();
      toggleActiveTab('Task');
      inputvm.showForm.placeholder = false;
      inputvm.showForm.fullpost = false;
      inputvm.showForm.event = false;
      inputvm.showForm.task = true;
      inputvm.showForm.micropost = true;
      inputvm.isValidFields = true;
      setTaskStatus('notStarted');
      setFocus();
    }

    function showEventForm() {
      setTitlePlaceholder();
      inputvm.creating = false;
      inputvm.resetRequiredFields();
      toggleActiveTab('Event');
      inputvm.showForm.placeholder = false;
      inputvm.showForm.micropost = true;
      inputvm.showForm.fullpost = false;
      inputvm.showForm.task = false;
      inputvm.showForm.event = true;
      inputvm.isValidFields = true;

      /*** NEW MODE ***/
      /*************************
       * SETUP FLATPICKER DATES
       * ***********************/
      dtEventStart = (dtEventStart == null || dtEventStart == undefined) ? initdtEventStart() : dtEventStart;
      dtEventEnd = (dtEventEnd == null || dtEventEnd == undefined) ? initdtEventEnd() : dtEventEnd;
      setFocus();
    }



    function showAdvancedOptions() {
      var co;
      var dt;
      inputvm.showForm.fullpost = inputvm.showForm.fullpost === true ? false : true;
      if (inputvm.showForm.fullpost) {
        if (!inputvm.editMode) {
          co = msContentOwner.getSelection();
          dt = inputvm.publishedDate;
          if (co.length == 0 || !dt) {
            // LoadAdvancedData();
          }
        } else {
          dt = timezone.convertToUsersTimezone(inputvm.publishedDate || inputvm.PublishedDate).locale;
          // LoadAdvancedData();
        }
      }
      if (!inputvm.editMode) inputvm.postStatus = 'New Post';
      inputvm.isAdvancedPost = inputvm.showForm.fullpost ? true : false;

      inputvm.showPinPost = interactiveInputSvc.getPinPostAccess();

    }

    function LoadAdvancedData(users) {
      // MAGIC SUGGEST ELEMENTS
      return $q(function (resolve, reject) {
        initmsContentOwner(users)
          .then(function resultContentOwner(co) {
            msContentOwner = co;
            msContentOwner.setSelection([{
              name: currentUser.name,
              networklogin: currentUser.networklogin,
              sharepointid: currentUser.sharepointid
            }]);
            return initmsKeyContacts(users);
          })
          .then(function resultKeyContacts(kc) {
            msKeyContacts = kc
            // FLAT PICKER
            dtPublishedDate = (dtPublishedDate == null || dtPublishedDate == undefined || dtPublishedDate == "") ? initdtPublishedDate() : dtPublishedDate;
            resolve(msKeyContacts);
          })
          .catch(function (err) {
            reject(err);
          });
      });

    }

    function addBodyToDigest(digest, body) {
      // digest & body need to be strings containing div elements
      if (digest == undefined || body == undefined) return;
      var combinedDigest = "";
      var divDigest;
      if (digest.indexOf("<div") >= 0) {
        divDigest = $(digest);
      } else {
        divDigest = document.createElement("div");
        divDigest.innerHTML = digest;
        divDigest = $(divDigest);
      }

      var divBody = $(body);
      if (divDigest.html() == "no digest") {
        divDigest.html(divBody.html());
      } else if (divDigest.html() == "") {
        divDigest.html(divBody.html());
      } else {
        divDigest.html(divDigest.html() + "<p></p>" + divBody.html());
      }
      combinedDigest = divDigest.html();
      return combinedDigest;
    }

    function assignFieldValues(postObj) {
      //==========================
      // * FILL IN FIELDS FROM POSTOBJ
      /*    OR 
       * EDIT MODE BY POST OBJECT(From HS)
       * (Click edit on post)
       * ****************************/
      var digestData;
      var co = getContentOwner(postObj);
      inputvm.pID = postObj.id;

      inputvm.title = (postObj.title) ? postObj.title : postObj.Title ? postObj.Title : '';
      var localtiny = tinymce.get("input-digest");

      // HANDLE SHARES AND DIGEST
      if (postObj.shareData || postObj.posttype == "Share") {
        // SHARED POST
        inputvm.showSharedTitle = true;
        digestData = (postObj.postdigest == null || postObj.postdigest == undefined || postObj.postdigest == "undefined") ? "" : postObj.postdigest;
        if (digestData != "") {
          digestData = typeof digestData !== 'string' ? $sce.valueOf(digestData) : digestData;
          digestData = common.decodeHTML(digestData);
        }
        inputvm.digest = digestData;
        //inputvm.loadedTiny.setContent(digestData);
        // tinymce.activeEditor.setContent(digestData);
        localtiny.setContent(digestData);
      } else {
        // REGULAR POST
        // This also covers Edit of Shared Posts from Homepage
        inputvm.showSharedTitle = false;
        digestData = postObj.postdigest || postObj.PostDigest;
        // Unwrap trusted sce value if it exists. Otherwise, leave value the same.
        digestData = typeof digestData !== 'string' ? $sce.valueOf(digestData) : digestData;
        digestData = (digestData == null || digestData == undefined || digestData == "undefined") ? "" : digestData;
        digestData = common.decodeHTML(digestData);
        if (postObj.postbody) {
          digestData = addBodyToDigest(digestData, postObj.postbody);
        }
      }

      // ASSIGN DIGEST INTO TINY
      if (digestData && digestData !== '') {
        inputvm.digest = digestData;
        localtiny.setContent(digestData);
      }

      inputvm.matterCoreTeamReminder = postObj.sendreminder || false;
      inputvm.matterCoreTeamReminderDays = postObj.reminderstart || 0;
      inputvm.isKeyPost = postObj.keypost;
      inputvm.postStatus = postObj.poststatus;
      inputvm.isEvent = (postObj.isevent) ? postObj.isevent : false;
      inputvm.isTask = (postObj.task) ? postObj.task : false;
      inputvm.postType = common.checkPostType(postObj);
      inputvm.ispostupdatedbyothers = postObj.ispostupdatedbyothers;

      // HANDLE CATEGORIES FOR EDIT
      if (postObj.hasOwnProperty("categories")) {
        inputvm.categories = (postObj.categories) ? postObj.categories : "";
      } else if (postObj.hasOwnProperty("post_categories")) {
        inputvm.categories = (postObj.post_categories) ? postObj.post_categories : "";
      }
      if (inputvm.categories && inputvm.categories.length > 0) {
        var categoryArr = [];
        var tempCat = inputvm.categories;
        tempCat = (common.isArray(tempCat)) ? tempCat : inputvm.categories.split(";");
        tempCat.forEach(function (cat, i) {
          if (cat != "") {

            if (cat.indexOf("^") <= 1) {
              // Remove carot and sepcial leading characters from category if they exist.
              var pos = cat.indexOf(":") + 1;
              var cat = cat.substr(pos);
            }
            categoryArr.push({
              id: i,
              name: cat
            });
          }
        });
        if (msCategories && categoryArr) {
          msCategories.setSelection(categoryArr);
        } else {
          initmsCategories(postObj.parentweburl)
            .then(function getCategoriesSuccess(data) {
              msCategories = data;
              msCategories.setSelection(categoryArr);
            })
        }
      } else {
        $("#input-categories input").css('width', 'inherit');
      }

      switch (inputvm.postType) {
        case 'Post':
          showMicroPostForm();
          break;
        case 'Task':
          taskStatus = postObj.taskstatus.toString();
          msAssignedTo.setSelection([{
            name: postObj.assignedto_displayname,
            networklogin: postObj.assignedto,
            sharepointid: postObj.assignedto_id,
            taskStatus: postObj.taskstatus


          }]);
          showTaskForm();
          setTaskStatus(taskStatus);

          inputvm.completedDate = postObj.datecompleted;
          inputvm.taskDueDate =  postObj.taskduedate;

          dtDueDate.setDate( timezone.getFormattedDateTime(inputvm.taskDueDate, true, 'MMM DD, YYYY'));
          dtCompleted.setDate( timezone.getFormattedDateTime(inputvm.completedDate, true, 'MMM DD, YYYY'));

          break;
        case 'Event':
          inputvm.eventLocation = (postObj.location) ? postObj.location : "";
          inputvm.startDate = postObj.event_start_date;
          inputvm.endDate = postObj.event_end_date;
          showEventForm();
          break;
        default:
          break;
      }
      //============================
      // Show advanced option values in edit mode for current item
      //============================
      inputvm.isAdvancedPost = (postObj.advancedpost) ? postObj.advancedpost : false;
      inputvm.publishedDate = (postObj.postpublished) ? timezone.getFormattedDateTime(postObj.postpublished) : moment.format();
      if (dtPublishedDate) {
        dtPublishedDate.setDate(timezone.getFormattedDateTime(inputvm.publishedDate, true, 'MMM DD, YYYY h:mm a'));
      } else {
        initdtPublishedDate()
      }
      if (!msContentOwner) {
        initmsContentOwner()
          .then(function msContentOwnerSuccess(co) {
            msContentOwner = co;
            msContentOwner.setSelection([{
              name: co.name,
              networklogin: co.networklogin,
              sharepointid: co.sharepointid
            }]);
            inputvm.contentOwner = msContentOwner.getSelection();
          });
      } else {
        msContentOwner.setSelection([{
          name: co.name,
          networklogin: co.networklogin,
          sharepointid: co.sharepointid
        }]);
        inputvm.contentOwner = msContentOwner.getSelection();
      }
      if (postObj.key_contacts) {
        // Initial function call would take at least 4 parameters:
        // keys, values, values, and delimiter.
        // Objective was to have the function return the key values combined as an array of objects, accepting any number of inputs.
        inputvm.keyContacts = common.convertStrDelimitedToArrayOfObjects(";", {
          name: postObj.key_contacts_displayname,
          sharepointid: postObj.key_contacts_id
        });
        msKeyContacts.setSelection(inputvm.keyContacts);
      }
      inputvm.redirectUrl = postObj.redirect_url;
      inputvm.postStatus = postObj.poststatus;
      inputvm.allowInteractive = postObj.postallowinteractivefeat;
      inputvm.showOnSite = postObj.postincludeonhomepage;
      inputvm.pinnedPost = postObj.pinnedpost;
      inputvm.redirectNewWindow = postObj.postopennewwindow;
      inputvm.isAdvancedPost ? inputvm.showAdvancedOptions() : null;
      inputvm.siteUrlForPost = postObj.siteurl;
      inputvm.postObj = postObj;
      inputvm.client = postObj.client;
      inputvm.matter = postObj.matter;
      if (inputvm.isMatters) {
        // CHECK FOR A COUPLE MAGIC SUGGEST METHODS
        // SOME PROPERTIES AND METHODS AREN'T EXPOSED THE SAME WAY IN EDGE AS THEY ARE IN CHROME.
        // ACCESSING PROTOTYPE OF MAGIC SUGGEST ISN'T AVAILABLE IN EDGE
        if (msClientMatter && msClientMatter["combobox"] && msClientMatter["selectionContainer"]) {
          inputvm.followedCM.forEach(function (cm, idx) {
            if (cm.client == inputvm.client && cm.matter == inputvm.matter) {
              msClientMatter.setSelection(cm);
            }
          });
          $timeout(function () {
            msClientMatter.disable()
          }, 500);
        }
      }
    }
    /*==========================
    * CALENDAR FUNCTIONS
    ==========================*/
    function showCalStartDate() {
      dtEventStart.open();
    }

    function showCalEndDate() {
      dtEventEnd.open();
    }

    function showCompletedDate() {
      dtCompleted.open();
    }



    function showCalPublishedDate() {
      dtPublishedDate.open();
    }

    function showCalDueDate() {
      dtDueDate.open();
    }

    function handleRedirectionToSinglePost(res) {
      var showOnSiteFeed = inputvm.showOnSite;
      if (common.getParameterByName('pID') || showOnSiteFeed === false || inputvm.postStatus == 'Draft') {
        if (res) {
          var id = (res.hasOwnProperty("d")) ? res.d.Id :
            (res.hasOwnProperty("data")) ? res.data.d.Id :
            common.getParameterByName('pID');
          var url = window.location.href.toLowerCase();
          if (url.indexOf("pages") >= 0 || showOnSiteFeed == false) {
            window.location.href = url.split('\/pages')[0] + '/pages/post.aspx?pID=' + id;
          } else {
            window.location.href = url.split('\/pages')[0];
          }
        } else {
          $rootScope.$broadcast('refreshFeed');
        }
        inputvm.showInputForm = showInput();
      }
    }

    /*==========================
    * SAVE POST METHODS
    ==========================*/
    function savePublishedPostData() {
      inputvm.postStatus = 'Published';
      savePostData()
        .then(function (res) {
          handleRedirectionToSinglePost(res);
          cancel();
        });

      // Override the Current Pinned Post
      if (inputvm.pinnedPost) {
        postSvc.overridePinnedPost();       
      }      

      $rootScope.$broadcast('showPostAfterEditMode');

    }

    function saveDraftPostData() {
      inputvm.postStatus = 'Draft';
      savePostData()
        .then(function (res) {
          $timeout(function () {
            handleRedirectionToSinglePost(res);
            cancel();
          }, 1000);
          // inputvm.showInputForm = showInput();
        });
    }

    function savePostData() {
      inputvm.digest = inputvm.loadedTiny.getContent();
      inputvm.contentOwner = msContentOwner.getSelection();
      var isValid = true;
      if (inputvm.isAdvancedPost) {
        isValid = validateFullpost();
      } else {
        isValid = validateMicropost();
      }
      if (isValid) {

        // SAVE TAGS TO THE TAGS LIST
        // var tagstoSave = inputvm.loadedTiny.plugins.hashtags.getUsers();
        var tagstoSave = hashtags.getHashtagValues(tinyMCE.activeEditor.getContent());
        if (tagstoSave.indexOf(' (new)') >= 0) {
          tagstoSave = tagstoSave.replace(/' (new)'/g, "")
        }
        threadSvc.saveHashTag(tagstoSave);
        inputvm.pID = inputvm.pID ? inputvm.pID : common.getParameterByName("pID");

        // SETUP DATAOBJ
        inputvm.postData = setupDataobjForSave(inputvm.postType, inputvm.isAdvancedPost, inputvm.ispostupdatedbyothers);
        return savePost(inputvm.postType);
      } else {
        inputvm.creating = false;
        return $q.reject(isValid);
      }
    }

    function saveFailed(error) {
      inputvm.creating = false;
      go.handleError(error);
    }

    function savePost(type) {
      if (common.isNullOrWhitespace(inputvm.siteUrlForPost)) inputvm.siteUrlForPost = _spPageContextInfo.webAbsoluteUrl;
      if (inputvm.editMode) {
        return interactiveInputSvc.updatePost(inputvm.postData, inputvm.postObj, inputvm.pID, inputvm.siteUrlForPost)
          .then(function updatePostSuccess(result) {
            saveSuccess(result, type);
            return result;
          })
          .catch(function (error) {
            saveFailed(error)
          });
      } else {
        return interactiveInputSvc
          .savePost({
            postData: inputvm.postData
          }, inputvm.siteUrlForPost)
          .then(function savePostSuccess(result) {
            saveSuccess(result, type);
            return result;
          })
          .catch(function (error) {
            saveFailed(error)
          });
      }
    }

    /**
     *  setupDataobjForSave
     *  Builds data object for passing to the save function.
     * @param {string} type  type of post
     * @param {boolean} advance advance accepts true/false on rather the post is an advanced post or not.
     * @param {string} ispostupdatedbyothers flag if the post has been updated by others
     * @returns returns a copy of the postdata object for saving. 
     */
    function setupDataobjForSave(type, advance, ispostupdatedbyothers) {
      try {

        // GET VALUES
        // var tinyMentions = inputvm.loadedTiny.plugins.mentions.getUsers();
        if (msCategories) {
          // msCategories MIGHT NOT EXIST IF THE SITE DOESN'T USE CATEGORIES
          var categories = msCategories.getSelection();
          categories = common.getObjValuesDelimitedBySemi(categories, 'name');
          var categoriesDisabled = msCategories.isDisabled();
        }
        var contentOwnerID = getContentOwnerId(); // (common.isArray(inputvm.contentOwner)) ? interactiveInputSvc.getContentOwner(inputvm.contentOwner) : inputvm.contentOwner;
        var keyContactsID = interactiveInputSvc.getKeyContacts(msKeyContacts.getSelection());
        var mentions = (inputvm.editMode) ? mentionsSvc.getMentionValues(tinyMCE.activeEditor.getContent()) : common.getObjValuesDelim(inputvm.loadedTiny.plugins.mentions.getUsers(), "sharepointid", ",");
        // Stopped using inputvm.loadedTiny.plugins.hashtags.getUsers()
        // method getUsers() brings back all elements with class hashtag-insert who does not have
        // data-mce-hashtags-id="0".
        // common.getObjValuesDelim(inputvm.loadedTiny.plugins.hashtags.getUsers(), "fullName", ",")
        var tags = hashtags.getHashtagValues(tinyMCE.activeEditor.getContent());
        var PostDigest = encodeURI(inputvm.loadedTiny.getContent());
        var PostPublished = inputvm.publishedDate ? moment(inputvm.publishedDate).format() : moment().format();
        var PostIncludeOnHomepage = inputvm.showOnSite;
        var PinnedPost = inputvm.pinnedPost;

      } catch (error) {
        go.handleError(error);
      }
      if (inputvm.isMatters) {
        var postData = {
          'Title': inputvm.title,
          'PostDigest': PostDigest,
          'PostContentOwnerId': contentOwnerID,
          'PostPublished': PostPublished,
          'Post_x0020_Status': inputvm.postStatus,
          'PostAllowInteractiveFeatures': inputvm.allowInteractive,
          'PostIncludeOnHomepage': PostIncludeOnHomepage,
          'PinnedPost': PinnedPost,
          // 'Client': common.getParameterByName('client'),
          // 'Matter': common.getParameterByName('matter')
        };
      } else {
        var postData = {
          'Title': inputvm.title,
          'PostDigest': PostDigest,
          'PostContentOwnerId': contentOwnerID,
          'PostPublished': PostPublished,
          'Post_x0020_Status': inputvm.postStatus,
          'PostAllowInteractiveFeatures': inputvm.allowInteractive,
          'PostIncludeOnHomepage': PostIncludeOnHomepage,
          'PinnedPost': PinnedPost,
        };
      }


      switch (type) {
        case 'Task':
          var assignToValue = interactiveInputSvc.getAssignedTo(msAssignedTo.getSelection());
          var TaskDueDate = moment(inputvm.taskDueDate).format();
          var sendReminder = inputvm.matterCoreTeamReminder ? inputvm.matterCoreTeamReminder.toString() : 'false'
          postData['AssignedToId'] = assignToValue;
          postData['TaskDueDate'] = TaskDueDate;
          postData['sendReminder'] = sendReminder;
          postData['isEvent'] = false;
          postData['Task'] = true;
          postData['TaskStatus'] = inputvm.dptaskstatusName.name;
          postData['DateCompleted'] = moment(inputvm.completedDate).format();

          break;
        case 'Event':
          var Event_x0020_Start_x0020_Date = moment(inputvm.startDate).format();
          var Event_x0020_End_x0020_Date = moment(inputvm.endDate).format();
          var Location = inputvm.eventLocation;
          postData['Event_x0020_Start_x0020_Date'] = Event_x0020_Start_x0020_Date;
          postData['Event_x0020_End_x0020_Date'] = Event_x0020_End_x0020_Date;
          postData['Location'] = Location;
          postData['isEvent'] = true;
          postData['Task'] = false;
          break;

        default:
          break;
      }
      // MATTERS
      if (inputvm.isMatters && common.getParameterByName('tab=landing')) {
        postData['KeyPost'] = inputvm.isKeyPost;
        if (msClientMatter && (msClientMatter["combobox"] && msClientMatter["selectionContainer"] || msClientMatter.length > 0)) {
          var clientMatter = msClientMatter.getSelection();
          if (clientMatter) {
            postData['Client'] = clientMatter[0].client;
            postData['Matter'] = clientMatter[0].matter;
          }
        }
      }

      (inputvm.redirectUrl) ? postData['Redirect_x0020_URL'] = inputvm.redirectUrl: null;
      (typeof categories == "string" && !categoriesDisabled) ? postData['Post_x0020_Categories'] = categories: null;
      (advance) ? postData['AdvancedPost'] = true: false;
      (tags) ? postData['Tags'] = tags: null;
      (keyContactsID) ? postData['Key_x0020_ContactsId'] = keyContactsID: null;
      (mentions) ? postData['MentionsId'] = {
        'results': (common.isArray(mentions)) ? mentions : returnMentions(mentions)
      }: null;
      postData = addClientMatterToData(postData);

      // Capture the user that updated the Post for History Log.
      postData['PostUpdatedById'] = parseInt(_spPageContextInfo.userId);
      postData['PostUpdatedDate'] = moment().format();

      // If IsPostUpdatedByOthers isn't true, and the Content Editor is NOT the current user, 
      // set IsPostUpdatedByOthers to true
      if (!ispostupdatedbyothers) {
        if (contentOwnerID != _spPageContextInfo.userId) {
          postData['IsPostUpdatedByOthers'] = true;
        }
      }

      return postData;
    }

    /**
     *  saveSuccess
     *  This function gets called after a post record has saved.
     * @param {object} result result of the save
     * @param {string} type post type. Ex. post, event, task
      returns nothing.
     */
    function saveSuccess(result, type) {
      if (inputvm.postStatus === 'Published') {
        if (result.hasOwnProperty("data")) {
          result.data.d["siteUrl"] = common.isOnHomepage() ? result.data.d.parentwebfullurl : _spPageContextInfo.webAbsoluteUrl;
          alertSvc.alert(result.data.d, type, 'Add', _spPageContextInfo.webTitle);
        } else if (inputvm.editMode) {
          if (result.hasOwnProperty("item") || result.data.hasOwnProperty("d")) {
            inputvm.postData["Id"] = inputvm.pID;
            inputvm.postData["siteUrl"] = common.isOnHomepage() ? result.data.d.parentwebfullurl : _spPageContextInfo.webAbsoluteUrl;
            alertSvc.alert(inputvm.postData, type, 'Edit', inputvm.postObj.sitetitle);
          } else {
            result.data.d["siteUrl"] = common.isOnHomepage() ? result.data.d.parentwebfullurl : _spPageContextInfo.webAbsoluteUrl;
            alertSvc.alert(result.data.d, type, 'Edit', inputvm.postObj.sitetitle);
          }
        } else {
          go.handleError(result.errmessage);
          var options = {
            text: type + " Failed!",
            direction: "topCenter"
          };
        }
      }

      var options = {
        text: type + " Saved Successfully!",
        direction: "topCenter"
      };
      $scope.$emit('toast', options);
      $rootScope.$broadcast('refreshFeed', result);
      inputvm.creating = false;
    }

    function handleRedirectToHome() {
      if (common.getParameterByName('pID')) {
        if (window.location.href.indexOf("Pages") >= 0) {
          window.location.href = window.location.href.split('\/Pages')[0];
        } else {
          window.location.href = window.location.href.split('\/pages')[0];
        }
      } else {
        $rootScope.$broadcast('refreshFeed');
      }
    }

    function deletePost(id) {
      // var siteurl = post.parentwebfullurl;
      var siteurl = _spPageContextInfo.webAbsoluteUrl;
      var id = inputvm.pID;
      var type = (inputvm.isEvent == true) ? 'Event' : inputvm.postType;
      var shouldDelete = confirm("Delete?");
      if (shouldDelete == true) {

        $rootScope.$broadcast('showPostAfterEditMode');

        interactiveInputSvc
          .deletePost(siteurl, id)
          .then(function (res) {
            var options = {
              text: type + " has been deleted!",
              direction: "topCenter"
            };
            $scope.$emit('toast', options);
            cancel();
            handleRedirectToHome();
          });
      } else {
        return;
      }

    }

    function setTaskStatus(status) {
      /*
      var complete = angular.element('.taskStatusCompleted');
      var inProgress = angular.element('.taskStatusInProgress');
      var notStarted = angular.element('.taskStatusNotStarted');
      var archived = angular.element('.taskStatusArchived');
      if (status == 'Completed') {
        complete.addClass('taskStatusActive');
        inProgress.removeClass('taskStatusActive');
        notStarted.removeClass('taskStatusActive');
        archived.removeClass('taskStatusActive');
        taskStatus = 'Completed';
      } else if (status == 'Archived') {
        archived.addClass('taskStatusActive');
        complete.removeClass('taskStatusActive');
        inProgress.removeClass('taskStatusActive');
        notStarted.removeClass('taskStatusActive');
        taskStatus = 'Archived';
      } else if (status == 'inProgress' || status == 'In Progress') {
        archived.removeClass('taskStatusActive');
        complete.removeClass('taskStatusActive');
        inProgress.addClass('taskStatusActive');
        notStarted.removeClass('taskStatusActive');
        taskStatus = 'In Progress';
      } else if (status == 'notStarted' || status == 'Not Started') {
        archived.removeClass('taskStatusActive');
        complete.removeClass('taskStatusActive');
        inProgress.removeClass('taskStatusActive');
        notStarted.addClass('taskStatusActive');
        taskStatus = 'Not Started';
      }

      */

      if (status == 'Completed') {

        inputvm.dptaskstatusName = inputvm.taskstatusItems[2];

      } else if (status == 'inProgress' || status == 'In Progress') {

        inputvm.dptaskstatusName = inputvm.taskstatusItems[1];

      } else if (status == 'notStarted' || status == 'Not Started') {

        inputvm.dptaskstatusName = inputvm.taskstatusItems[0];

      }


    }

    /*==========================
    * HELPER METHODS
    ==========================*/

    function addClientMatterToData(data) {
      if (common.getParameterByName('matter')) {
        data["Matter"] = common.getParameterByName('matter');
      }
      if (common.getParameterByName('client')) {
        data["Client"] = common.getParameterByName('client');
      }
      return data;
    }

    function returnMentions(mentionsArr) {
      if (!mentionsArr) return [];

      var arrOfIds = [];
      if (typeof mentionsArr == "number") {
        arrOfIds.push(mentionsArr);
        return arrOfIds;
      }
      if (typeof mentionsArr == "string") mentionsArr = mentionsArr.split(",")
      if (mentionsArr[0].hasOwnProperty("sharepointid")) {
        mentionsArr.forEach(function (mention) {
          arrOfIds.push(Number(mention.sharepointid));
        });
      } else {
        mentionsArr.forEach(function (mention) {
          arrOfIds.push(Number(mention));
        });
      }

      return arrOfIds;
    }

    function cancel() {
      inputvm.showPlaceholder();
      setTaskStatus('notStarted');
      resetForm();
      inputvm.showInputForm = showInput();

      $rootScope.$broadcast('showPostAfterEditMode');
    }

    function openDigest() {
      if (inputvm.loadedTiny) return $q.resolve(inputvm.loadedTiny);
      if (tinymce.activeEditor && tinymce.activeEditor.id == "input-digest") return $q.resolve(tinymce.activeEditor);
      var options = {
        selector: '#input-digest',
        height: 400,
        inline: false,
        hideToolbar: false,
        defaultText: '',
        fn: function () {
          deferred.resolve(true);
        }
      };
      if (inputvm.editMode && postObj.shareData) {
        options["auto_focus"] = 'input-digest'
      }
      // CHECK IF TINY EXISTS BEFORE ATTEMPTING TO CREATE IT
      var checkIfTinyExists = common.checkTinyEditor(options.selector);
      if (checkIfTinyExists == false) {
        return tinymceSvc.newTinyMce(options)
          .then(function newTinyMceSuccess(res) {
            return res;
          })
          .catch(function newTinyMceFail(err) {
            return err;
          });
      } else if (checkIfTinyExists) {
        // THIS TINY EDITOR EXISTS. RETURN IT.
        return checkIfTinyExists;
      }
    }

    /**
     *  getContentOwner
     *  Gets content owner 
     * @param {*} postObj
     * @returns
     */
    function getContentOwner(postObj) {
      var co = {};
      if (postObj.PostContentOwner) {
        co = {
          name: postObj.postcontentowner_display || postObj.PostContentOwner["Title"] || postObj.createdby_displayname,
          networklogin: postObj.postcontentowner || postObj.PostContentOwner["Name"] || postObj.createdby,
          sharepointid: postObj.postcontentowner_id || postObj.PostContentOwnerId || postObj.createdbyid
        };
      } else {
        co = {
          name: postObj.postcontentowner_display || postObj.createdby_displayname,
          networklogin: postObj.postcontentowner || postObj.createdby,
          sharepointid: postObj.postcontentowner_id || postObj.createdbyid
        }
      }
      return co
    }

    function getContentOwnerId() {
      var reg = /^\d+$/;
      // We're assuming inputvm.contentOwner has value
      var co = (common.isArray(inputvm.contentOwner)) ? interactiveInputSvc.getContentOwner(inputvm.contentOwner) :
        reg.test(inputvm.contentOwner) ? inputvm.contentOwner : inputvm.contentOwner;
      return co;
    }

    // INIT FUNCTIONS

    function initdtEventStart(customOptions) {
      var options = {
        enableTime: true,
        dateFormat: "M d, Y h:i K",
        defaultDate: timezone.getFormattedDateTime("", true, "M d, Y h:i K"),
        onChange: function (selectedDates, dateStr) {
          $scope.$apply(function () {
            inputvm.startDate = dateStr;
          });
          // Increase end date each time start date changes
          var endDateValue = moment(dateStr).add(1, 'hours').toDate();
          dtEventEnd.setDate(endDateValue, true, 'M d, Y h:i K');
        },
        onReady: function (selectedDates, dateStr, instance) {
          inputvm.startDate = timezone.getFormattedDateTime("", true, 'MMM DD, YYYY h:mm a');
          instance.setDate(inputvm.startDate);
          angular.element(instance).css('visibility', 'hidden').css('display', 'none')
        },
        plugins: [new confirmDatePlugin({
          showAlways: true
        })]
      }
      options = (customOptions) ? common.appendOptions(options, customOptions) : options;
      return angular.element("#input-startDate").flatpickr(options);
    }

    function initdtEventEnd(customOptions) {
      var options = {
        enableTime: true,
        dateFormat: "M d, Y h:i K",
        defaultDate: timezone.getFormattedDateTime("", true, "M d, Y h:i K"),
        onChange: function (selectedDates, dateStr) {
          $scope.$apply(function () {
            inputvm.endDate = dateStr;
          });
        },
        onReady: function (dateObj, dateStr, instance) {
          inputvm.endDate = timezone.getFormattedDateTime("", true, 'MMM DD, YYYY h:mm a', +1);
          instance.setDate(inputvm.endDate);
        },
        plugins: [new confirmDatePlugin({
          showAlways: true
        })]
      };
      options = (customOptions) ? common.appendOptions(options, customOptions) : options;
      return angular.element("#input-endDate").flatpickr(options);
    }

    function initdtCompleted(customOptions) {
      var options = {
        enableTime: true,
        dateFormat: "M d, Y h:i K",
        defaultDate: timezone.getFormattedDateTime("", true, "M d, Y h:i K"),
        onChange: function (selectedDates, dateStr) {
          $scope.$apply(function () {
            inputvm.completedDate = dateStr;
          });
        },
        onReady: function (dateObj, dateStr, instance) {
          inputvm.completedDate = timezone.getFormattedDateTime("", true, 'MMM DD, YYYY h:mm a', +1);
          instance.setDate(inputvm.completedDate);
        },
        plugins: [new confirmDatePlugin({
          showAlways: true
        })]
      };
      options = (customOptions) ? common.appendOptions(options, customOptions) : options;
      return angular.element("#input-completedDate").flatpickr(options);
    }

    function initmsCategories(url) {
      // Get Categories

      return interactiveInputSvc.getCategories(url)
        .then(function (data) {
          var options = {};
          options = setupCategoryOptions(data);
          return interactiveInputSvc.newMagicSuggest(options);
        });
    }

    function initTaskFields() {
      // INIT PUBLISHED DATE FIELD
      dtDueDate = angular.element("#input-task-dueDate").flatpickr({
        enableTime: true,
        clickOpens: true,
        dateFormat: "M d, Y",
        defaultDate: (inputvm.editMode) ? timezone.getFormattedDateTime(inputvm.taskDueDate, true, 'MMM DD, YYYY') : timezone.getFormattedDateTime("", true, 'MMM DD, YYYY'),
        onChange: function (selectedDates, dateStr) {
          $scope.$apply(function () {
            inputvm.taskDueDate = dateStr;
          });
        },
        onReady: function (selectedDates, dateStr, instance) {
          inputvm.taskDueDate = (inputvm.editMode) ? timezone.getFormattedDateTime(inputvm.taskDueDate, true, 'MMM DD, YYYY') : timezone.getFormattedDateTime("", true, 'MMM DD, YYYY');
          instance.setDate(inputvm.taskDueDate);
          angular.element(instance).css('visibility', 'hidden').css('display', 'none');
        },
        plugins: [new confirmDatePlugin({
          showAlways: true
        })]
      });


      dtCompleted = angular.element("#input-completedDate").flatpickr({
        enableTime: true,
        clickOpens: true,
        dateFormat: "M d, Y",
        defaultDate: (inputvm.editMode) ? timezone.getFormattedDateTime(inputvm.completedDate, true, 'MMM DD, YYYY') : timezone.getFormattedDateTime("", true, 'MMM DD, YYYY'),
        onChange: function (selectedDates, dateStr) {
          $scope.$apply(function () {
            inputvm.completedDate = dateStr;
          });
        },
        onReady: function (selectedDates, dateStr, instance) {
          inputvm.completedDate = (inputvm.editMode) ? timezone.getFormattedDateTime(inputvm.completedDate, true, 'MMM DD, YYYY') : timezone.getFormattedDateTime("", true, 'MMM DD, YYYY');
          instance.setDate(inputvm.completedDate);
          angular.element(instance).css('visibility', 'hidden').css('display', 'none');
        },
        plugins: [new confirmDatePlugin({
          showAlways: true
        })]
      });



      initmsAssignedTo()
        .then(function resultmsAssignedTo(obj) {
          msAssignedTo = obj;
        });
    }

    function initmsClientMatter(data) {
      return $q.resolve(interactiveInputSvc.newMagicSuggest({
        allowFreeEntries: false,
        cls: 'ms-custom-class',
        data: data,
        id: '#input-clientmatter',
        maxSelection: 1,
        maxSuggestions: 20,
        maxSelectionRenderer: function () {
          return "Only one item can be selected.";
        },
        selectionRenderer: function (data) {
          return data.title;
        },
        placeholder: 'Select Client - Matter'
      }));
    }

    function initmsAssignedTo() {
      return $q.resolve(interactiveInputSvc.newMagicSuggest({
        cls: 'ms-custom-class',
        data: userData,
        id: '#input-assignTo',
        icon: 'fa fa-user',
        maxSelection: 1,
        maxSuggestions: 100,
        maxSelectionRenderer: function () {
          return "Only one item can be selected.";
        },
        placeholder: 'Add Assigned To'
      }));
    }

    /**
     *  initmsContentOwner
     *  Initialize Magic Suggest for Content Owner
     * @returns Returns promise containing the magic suggest object
     */
    function initmsContentOwner(users) {
      return $q.resolve(interactiveInputSvc.newMagicSuggest({
        cls: 'ms-custom-class',
        data: users || userData,
        id: '#input-contentOwner',
        icon: 'fa fa-user',
        placeholder: '',
        maxSuggestions: 10,
        maxSelection: 1,
        maxSelectionRenderer: function () {
          return "Only one item can be selected.";
        }
      }));
    }

    /**
     *  initmsKeyContacts
     *  Initialize Magic Suggest for Key Contacts
     * @returns Returns promise containing the magic suggest object
     */
    function initmsKeyContacts(users) {
      return $q.resolve(interactiveInputSvc.newMagicSuggest({
        cls: 'ms-custom-class',
        data: users || userData,
        id: '#input-keyContacts',
        icon: 'fa fa-user',
        maxSuggestions: 10,
        placeholder: 'Add Key Contacts'
      }));
    }

    function initdtPublishedDate() {
      return angular.element("#input-publishedDate").flatpickr({
        enableTime: true,
        dateFormat: "M d, Y h:i K",
        defaultDate: new Date(),
        onChange: function (selectedDates, dateStr) {
          $scope.$apply(function () {
            inputvm.publishedDate = dateStr;
          });
        },
        onReady: function (selectedDates, dateStr, instance) {
          // Not setting an initial value.
          // Instead we grab the current date/time upon saving the post
          angular.element(instance).css('visibility', 'hidden').css('display', 'none');
        },
        plugins: [new confirmDatePlugin({
          showAlways: true
        })]
      });
    }

    /*==========================
        * VALIDATION METHODS
        ==========================*/
    function validateMicropost() {
      //validating required fields in micropost
      //if inputvm.isValidFields is consistently true along the validation process then the form passes validation  
      inputvm.isValidFields = true;
      // Check Digest
      //=======================================================================
      // showSharedTitle flag means that a post is a Share. Allow blank digest in this case.
      if ((inputvm.digest == '' || inputvm.digest == undefined) && !inputvm.showSharedTitle) {
        inputvm.isValid.digest = false;
        angular.element('#input-digest').addClass('has-error');
        inputvm.isValidFields = false;
      } else {
        angular.element('#input-digest').removeClass('has-error');
        inputvm.isValid.digest = true;
      }
      // CHECK CLIENT MATTERS DROPDOWN
      if (inputvm.isMatters && inputvm.mattersTab == 'landing' && inputvm.editMode == false) {
        if (common.isNullOrWhitespace(inputvm.clientmatters)) {
          inputvm.isValid.clientMatter = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.clientMatter = true;
        }
      }
      if (inputvm.postType == 'Event') {
        if (inputvm.title == '' || inputvm.title == undefined) {
          inputvm.isValid.title = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.title = true;
        }
        if (inputvm.eventLocation == '' || inputvm.eventLocation == undefined) {
          inputvm.isValid.eventLocation = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.eventLocation = true;
        }
        if (inputvm.startDate == '' || inputvm.startDate == undefined) {
          inputvm.isValid.eventStartDate = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.eventStartDate = true;
        }
        if (inputvm.endDate == '' || inputvm.endDate == undefined) {
          inputvm.isValid.eventEndDate = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.eventEndDate = true;
        }
      }
      if (inputvm.postType == 'Task') {
        if (inputvm.title == '' || inputvm.title == undefined) {
          inputvm.isValid.title = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.title = true;
        }
        if (inputvm.taskDueDate == '' || inputvm.taskDueDate == undefined) {
          inputvm.isValid.taskDueDate = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.taskDueDate = true;
        }
        try {
          inputvm.assignedTo = interactiveInputSvc.getAssignedTo(msAssignedTo.getSelection());
        } catch (e) {
          inputvm.assignedTo = '';
        }
        if (inputvm.assignedTo == '' || inputvm.assignedTo == undefined) {
          inputvm.isValid.assignedTo = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.assignedTo = true;
        }
      }
      if (inputvm.isValidFields == false) {
        inputvm.creating = false;
      }
      return inputvm.isValidFields;
    }

    function validateFullpost() {
      inputvm.isValidFields = true;
      // Check Digest
      if (inputvm.digest == '' || inputvm.digest == undefined && !inputvm.showSharedTitle) {
        angular.element('#input-digest').addClass('has-error');
        inputvm.isValid.digest = false;
        inputvm.isValidFields = false;
      } else {
        angular.element('#input-digest').removeClass('has-error');
        inputvm.isValid.digest = true;
      }
      try {
        inputvm.contentOwner = (typeof inputvm.contentOwner == "object") ? interactiveInputSvc.getContentOwner(inputvm.contentOwner) : interactiveInputSvc.getContentOwner(msContentOwner.getSelection());
      } catch (e) {
        inputvm.contentOwner = '';
      }
      if (inputvm.contentOwner == '' || inputvm.contentOwner == undefined) {
        inputvm.isValid.contentowner = false;
        inputvm.isValidFields = false;
      } else {
        inputvm.isValid.contentowner = true;
      }
      // We're not checking published date anymore since it gets created upon saving, assuming it wasn't changed.
      // if (inputvm.publishedDate == '' || inputvm.publishedDate == undefined) {
      //   inputvm.isValid.publishedDate = false;
      //   inputvm.isValidFields = false;
      // } else {
      //   inputvm.isValid.publishedDate = true;
      // }
      if (inputvm.postType == 'Event') {
        if (inputvm.title == '' || inputvm.title == undefined) {
          inputvm.isValid.title = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.title = true;
        }
        if (inputvm.eventLocation == '' || inputvm.eventLocation == undefined) {
          inputvm.isValid.eventLocation = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.eventLocation = true;
        }
        if (inputvm.startDate == '' || inputvm.startDate == undefined) {
          inputvm.isValid.eventStartDate = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.eventStartDate = true;
        }
        if (inputvm.endDate == '' || inputvm.endDate == undefined) {
          inputvm.isValid.eventEndDate = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.eventEndDate = true;
        }
      }
      if (inputvm.postType == 'Task') {
        if (inputvm.title == '' || inputvm.title == undefined) {
          inputvm.isValid.title = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.title = true;
        }
        if (inputvm.taskDueDate == '' || inputvm.taskDueDate == undefined) {
          inputvm.isValid.taskDueDate = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.taskDueDate = true;
        }
        try {
          inputvm.assignedTo = interactiveInputSvc.getAssignedTo(msAssignedTo.getSelection());
        } catch (e) {
          inputvm.assignedTo = '';
        }
        if (inputvm.assignedTo == '' || inputvm.assignedTo == undefined) {
          inputvm.isValid.assignedTo = false;
          inputvm.isValidFields = false;
        } else {
          inputvm.isValid.assignedTo = true;
        }
      }
      if (inputvm.isValidFields == false) {
        inputvm.creating = false;
      }
      return inputvm.isValidFields;
    }
    /*==========================
    * TOGGLE TABS
      this is for switching between tabs for event,taks and post
      isAdvancedPost will just be updated on new form to make it hidden in switching tabs unless user clicks the advance tab
    ==========================*/
    function toggleActiveTab(activeTab) {
      if (activeTab === 'Post') {
        inputvm.postType = 'Post';
        if (inputvm.editMode !== true) inputvm.isAdvancedPost = false;
        inputvm.postClass = 'wc-pi-charm-active';
        inputvm.eventClass = '';
        inputvm.taskClass = '';
      } else if (activeTab === 'Event') {
        inputvm.postType = 'Event';
        if (inputvm.editMode !== true) inputvm.isAdvancedPost = false;
        inputvm.eventClass = 'wc-pi-charm-active';
        inputvm.postClass = '';
        inputvm.taskClass = '';
      } else {
        inputvm.postType = 'Task';
        if (inputvm.editMode !== true) inputvm.isAdvancedPost = false;
        inputvm.taskClass = 'wc-pi-charm-active';
        inputvm.eventClass = '';
        inputvm.postClass = '';
      }
    }
    /*==========================
    * RESET FORM 
    ==========================*/
    function resetForm() {
      if (inputvm.editMode) {
        inputvm.contentOwner = '';
      }
      inputvm.redirectNewWindow = false;
      inputvm.allowInteractive = true;
      inputvm.showSharedTitle = false;
      inputvm.isAdvancedPost = false;
      inputvm.showOnSite = true;
      inputvm.pinnedPost = false; // Default value should be false
      inputvm.editMode = false;
      inputvm.publishedDate = '';
      inputvm.keyContacts = '';
      inputvm.redirectUrl = '';
      inputvm.categories = '';
      inputvm.postStatus = '';
      inputvm.digest = '';
      inputvm.images = '';
      inputvm.title = '';
      inputvm.files = '';
      inputvm.eventLocation = '';
      inputvm.taskDueDate = '';
      inputvm.eventClass = '';
      inputvm.taskClass = '';
      inputvm.dtDueDate = '';
      inputvm.startDate = '';
      inputvm.userPhoto = '';
      inputvm.postData = '';
      inputvm.postType = '';
      inputvm.endDate = '';
      inputvm.matter = '';
      inputvm.client = '';
      inputvm.title = '';
      inputvm.pID = '';
      inputvm.postObj = {};

      (dtCompleted == null || dtCompleted == undefined) ? initdtCompleted(): dtCompleted.setDate(timezone.getFormattedDateTime("", true, 'MMM DD, YYYY h:mm a'));

      (dtEventStart == null || dtEventStart == undefined) ? initdtEventStart(): dtEventStart.setDate(timezone.getFormattedDateTime("", true, 'MMM DD, YYYY h:mm a'));
      (dtEventEnd == null || dtEventEnd == undefined) ? initdtEventEnd(): dtEventEnd.setDate(timezone.getFormattedDateTime("", true, 'MMM DD, YYYY h:mm a', +1));




      (msKeyContacts) ? msKeyContacts.clear(): null;
      (msAssignedTo) ? msAssignedTo.clear(): null;
      (msCategories) ? msCategories.clear(): null;
      (msClientMatter && msClientMatter["combobox"] && msClientMatter["selectionContainer"]) ? msClientMatter.clear(): null;
      // Don't reset the following fields. 
      // Assuming same user on the  page, these fields would retain the same values.
      // inputvm.contentOwner = '';
      // msCategories.clear();
      // msContentOwner.clear();

    }

    function resetRequiredFields() {
      inputvm.isValid.publishedDate = true;
      inputvm.isValid.digest = true;
      inputvm.isValid.eventLocation = true;
      inputvm.isValid.eventStartDate = true;
      inputvm.isValid.eventEndDate = true;
      inputvm.isValid.taskDueDate = true;
      inputvm.isValid.contentOwner = true;
      inputvm.isValid.assignedTo = true;
      inputvm.isValidFields = true;
    }

    /**
     * =========================================================
     * This function sets the overridePinnedPost flag depending
     * on the user's response.
     * =========================================================
     */
    function onClickPinPost() {

      // Flag to override the current pinned post
      var overridePinnedPost = false;

      // Check if there's already a Pinned Post in the Site
      var pinnedPost = common.getLocal("PinnedPost");
      if (pinnedPost && pinnedPost.site == _spPageContextInfo.webAbsoluteUrl) {
        
        // Check the current selected value
        if (common.stringToBoolean(inputvm.pinnedPost)) {

          // Ask the user if he wants to override the Current Pinned Post
          var confirmation = confirm('Do you want to override the current Pinned Post?');
          if (common.stringToBoolean(confirmation)) {
            // User wants to override the current pinned post
            overridePinnedPost = true;            
          } else {
            // User DOES NOT want to override the current pinned post
            inputvm.pinnedPost = false;
          }
        }
      }

      inputvm.overridePinnedPost = overridePinnedPost;
    }

    init();

  }
})();