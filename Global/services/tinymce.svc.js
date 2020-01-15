(function () {
  'use strict';

  ExecuteOrDelayUntilScriptLoaded(function () {
    var scriptbase = _spPageContextInfo.siteAbsoluteUrl + "/_layouts/15/";
    // Load the js files and continue to the successHandler
    $.getScript(scriptbase + "SP.RequestExecutor.js", function () {
      //   console.log("request executor is now loaded");
      // Logic here... Load other scripts
    });
  }, "sp.js");

  String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
  };

  reconnectApp
    .factory('tinymceSvc', TinymceSvc);

  TinymceSvc.$inject = ['$compile','$q', '$timeout', 'socialDataSvc', 'go', 'common', 'compressImgSvc'];

  function TinymceSvc($compile, $q, $timeout, socialDataSvc, go, common, compressImgSvc) {
    var FILESIZE = 512000;

    var returnTinymce = {
      newTinyMce: newTinyMce,
      mentions_select: mentions_select,
      mentions_menu_complete: mentions_menu_complete
    };

    var mentions_selector = 'span.mentionsSelector';

    function mentions_menu_complete(editor, userinfo) {
      var link = _spPageContextInfo.siteAbsoluteUrl + '/Pages/PersonDetail.aspx?DOCID=people::jdbc:people/' + userinfo.timekeeperId;
      var span = editor.getDoc().createElement('span');
      span.className = 'mentionsSelector';
      var a = editor.getDoc().createElement('a');
      a.className = 'mention';
      a.setAttribute('data-userId', userinfo.sharepointid);
      a.setAttribute('href', link);
      a.appendChild(editor.getDoc().createTextNode('@' + userinfo.name));
      span.appendChild(a);
      return span;
    }

    function mentions_select(mention, success) {
      var span = document.createElement('span');
      success(span);
    }

    function guid() {
      function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    /**
     * Create New TinyMCE Instance
     *
     * This method creates a new instance of TinyMCE on the page.
     * @param {*} options
     */
    function newTinyMce(options) {
      var images_upload_url = _spPageContextInfo.webAbsoluteUrl + "/PublishingImages";
      var pluginsArr = ['advlist lists advcode table mentions hashtags media mediaembed image link table powerpaste code textcolor colorpicker'];
      // var pluginsArr = ['advlist lists advcode table autoresize mentions hashtags media mediaembed image imagetools link table powerpaste code'];
      // var toolbar = options.hideToolbar ? false : ['wcAttach   | link | bold italic underline | forecolor removeformat | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent |  insert styleselect code   '];
      var toolbar = options.hideToolbar ? false : ['insert | bold italic underline strikethrough | forecolor backcolor | fontselect | fontsizeselect | removeformat | table | alignleft aligncenter alignright alignjustify | bullist numlist | code'];

      if (detectMobile()) {
        toolbar = options.hideToolbar ? false : ['link | image | fontsizeselect'];
      }

      var waveConfig = {
        docId    : guid(),
        username : "Andy B",
        apiKey   : "7bdf58a1-e722-4868-bee9-b7e7c65a09b6" //demo API Key
        };

      var style_formats = [{
          title: 'Image Left',
          selector: 'img',
          styles: {
            'float': 'left',
            'margin': '0 6px 0 0'
          }
        },
        {
          title: 'Image Right',
          selector: 'img',
          styles: {
            'float': 'right',
            'margin': '0 0 0 6px'
          }
        }
      ];

      var formats = {
        fontselectsize: {
          inline: 'span',
          styles: {
            fontsize: '%value'
          }
        },
        forecolor: {
          inline: 'span',
          styles: {
            color: '%value'
          }
        },
        hilitecolor: {
          inline: 'span',
          styles: {
            backgroundColor: '%value'
          }
        }
      }

      var content_style = ".mce-content-body {" +
        "font-family: Arial !important; font-size: 12pt!important;padding-bottom:0px!important;" +
        "min-height:150px!important;" +
        // "max-height:500px!important;overflow-y:scroll;" + 
        "} " +
        ".mention { color: #0099cc;} " +
        ".hashtag {color: #0099cc;} " +
        "iframe{max-width:640px!important; max-height:720px!important;}" +
        "#tinymce img{max-width:640px;padding:10px;}" +
        "#post-view img{padding:10px;}" +
        "p{margin:0!important;}"
        // + "body {min-height: 100px!important;} " 
        +
        "html {min-height:150px;}"

      var tinyOptions = {
        auto_focus: options.autofocusID !== undefined ? options.autofocusID.replace("#", "") : true,
        /* Enable or disable automatic upload of images represented by data URLs or blob URIs. 
        Such images get generated, for example, as a result of image manipulation through Image Tools plugin, 
        or after image is drag-n-dropped onto the editor from the desktop. */
        automatic_uploads: true,
        branding: false,
        browser_spellcheck: true,
        content_style: content_style,
        document_base_url: _spPageContextInfo.webAbsoluteUrl,
        extended_valid_elements: "iframe[src|frameborder|style|scrolling|class|width|height|name|align|allow|encrypted-media|allowfullscreen]",
        // forced_root_block : "", // When this is enabled, <p> tags go away. <br>'s are used instead. 
        file_picker_types: 'image',
        file_browser_callback_types: 'image',
        // file_browser_callback: file_browser_callback, // Callback after tiny file browser selection is made
        file_picker_callback: file_picker_callback,
        fontsize_formats: "8pt 10pt 11pt 12pt 14pt 16pt 18pt 22pt 24pt 36pt 48pt",
        formats: formats,
        init_instance_callback: function (editor) {
          // TODO: Need to add onclose event to the window manager

          console.log("Editor: " + editor.id + " is now initialized.");
        },
        image_title: false,
        image_description: false,
        image_dimensions: false,
        // Removed imagetools_toolbar since saving modified image is experimental.
        // imagetools_toolbar: "rotateleft rotateright | flipv fliph | editimage imageoptions",
        imagetools_toolbar: '',
        images_upload_handler: images_upload_handler, // drag n drop
        images_upload_url: images_upload_url,
        // insert_button_items: 'inserttable link anchor | template',
        // init_instance_callback: init_instance_callback,
        hashtags_fetch: common.debounce(hashtags_fetch, 500),
        hashtags_menu_complete: hashtags_menu_complete,
        mediaembed_service_url: _spPageContextInfo.webAbsoluteUrl + "/Shared%20Documents",
        mediaembed_max_width: '450px',
        mentions_fetch: mentions_fetch,
        mentions_select: mentions_select,
        mentions_menu_complete: mentions_menu_complete,
        mentions_selector: mentions_selector,
        menubar: false, // 'insert',
        paste_data_images: true, // Drag n drop images
        paste_enable_default_filters: false,
        paste_word_valid_elements: "b,string,i,em,h1,h2,p,span",
        // handles paste/dropped images. 
        // This option enables you to modify the pasted content before it gets inserted into the editor but after it's been parsed into a DOM structure.
        // Takes 2 arguments, plugin and args. args contains the node element being pasted.
        //paste_postprocess:  paste_postprocess, 
        plugins: pluginsArr,
        powerpaste_word_import: 'prompt',
        powerpaste_html_import: 'prompt',
        relative_urls: false,
        remove_script_host: false,
        setup: setupTiny,
        statusbar: false,
        style_formats: style_formats,
        theme: 'modern',
        toolbar: toolbar, //  false, //styleselect image insert
        // urlconverter_callback: urlconverter_callback, // Intercept URLs
        valid_elements: '*[*]',
        valid_children: 'p[br]',
        // external_plugins : {
        //   wave : "https://cdn2.stage.codox.io/waveTinymce/plugin.min.js"
        // },
        // wave   : waveConfig
        table_style_by_css: true
      };

      if (options) {
        tinyOptions = common.appendOptions(tinyOptions, options);
      }

      function init_instance_callback(editor) {
        editor.buttons["insert"].icon = "plus-circle";
      }

      function deleteImageFromSP(imgNode) {
        var selectedNode = imgNode || tinymce.activeEditor.selection.getNode(); // get the selected node (element) in the editor
        if (selectedNode && selectedNode.nodeName == 'IMG') {
          // A callback that will let me invoke the deletion of the image on the server if appropriate for the image source.
          var src = selectedNode.src;
          var pos = src.lastIndexOf("/");
          var filename = src.substring(pos + 1, src.length);
          var url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/getfolderbyserverrelativeurl('" + _spPageContextInfo.webServerRelativeUrl + "/PublishingImages/" + filename + "')/recycle";
          var deleteItem = new SP.RequestExecutor(_spPageContextInfo.webAbsoluteUrl);
          deleteItem.executeAsync({
            url: url,
            method: "POST",
            headers: {
              "accept": "application/json; odata=verbose"
            },
            success: successHandler,
            error: errorHandler
          });
        }
      }

      /**
       *  This function will determine if compression is needed.
       *  Criteria is based on browser and file size.
       *  At the moment if browser is non-chrome, do not compress.
       */
      function handleImageCompression(file) {
        var chrome = checkForChrome();
        var filename = "";
        // PNGs don't resolve with a filename property from blob();

        if (file.hasOwnProperty("blob")) {
          // EXTRACT BLOB
          filename = file.filename();
          file = file.blob();
        } else {
          filename = file.name;
        }

        if (file.size > FILESIZE && chrome) {
          // NO ARGUMENT TO RENAME FUNCTION. 
          // THIS TELLS IT TO APPENED .JPEG EXTENSION TO THE FILE.
          filename = renameFile();
          return compressImgSvc.compressImage(file)
            .then(function (binary) {
              return {
                binary: binary,
                file: file,
                filename: filename
              }
            })
        } else {
          filename = renameFile(filename, file.type);
          return compressImgSvc.blobToArrayBuffer(file)
            .then(function blobToArrayBufferSuccess(buffer) {
              return compressImgSvc.bufferToBinary(buffer);
            })
            .then(function bufferToBinarySuccess(binary) {
              return {
                binary: binary,
                file: file,
                filename: filename
              }
            });
        }
      }

      function file_browser_callback(field_name, url, type, win) {

      }

      /**
       *  file_picker_callback 
       *  Used by Tiny's Insert --> Image, Link, Media
       * @param {function} cb     a callback to call, once you have a hold of the file; it expects new value for the field as the first argument and optionally meta information for other fields in the dialog as the second one
       * @param {any} value   current value of the affected field
       * @param {object} meta     object containing values of other fields in the specified dialog (notice that meta.filetype contains the type of the field)
       *  Returns void
       */
      function file_picker_callback(cb, value, meta) {

        if (meta.filetype == "image") {
          // var browser = checkForChrome();
          var bloburi = "";
          // var ngImageUpload = document.getElementById("input-imageUpload"); // Hidden element on the page that has to exist first. 
          var ngImageUpload = angular.element("#input-imageUpload"); // Hidden element on the page that has to exist first. 
          // ngImageUpload.setAttribute('type', 'file');
          ngImageUpload.attr('type', 'file');
          ngImageUpload.attr('accept', 'image/*');
          ngImageUpload.change(function onChange() {
            // Show progress for the active editor
            tinyMCE.activeEditor.setProgressState(true);
            if (this.files.length == 0) return;
            var file = {}
            file = this.files[0];
            if (file) {
              var reader = new FileReader();
              reader.onload = function (e) {
                var id = 'blobid' + (new Date()).getTime();
                var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                var base64 = reader.result.split(',')[1];
                var blobInfo = blobCache.create(id, file, base64);
                blobCache.add(blobInfo);
                bloburi = blobInfo.blobUri();
                handleImageCompression(file)
                  .then(function (img) {
                    updateSourceUrl(img.filename);
                    uploadImageToSharePoint(img.binary, img.filename, bloburi, undefined, cb);
                    // tinyMCE.activeEditor.setProgressState(false);
                  });
              }
              reader.readAsDataURL(file);
              angular.element("#input-imageUpload")[0].value = "";
            }
          }); // END OF ONCHANGE FUNCTION

          ngImageUpload.click();

        } else if (meta.filetype == "file") {
          //cb("", null);
        } else if (meta.filetype == "media") {
          // TODO: DO SOMETHING FOR MEDIA
        } else {
          //   console.log("Invalid uplaod");

        }
        cb = "";
      }

      /**
       * Used by drag n drop in Tiny
       *  images_upload_handler
       *  Used by Tiny's drag n drop. Captures image data.
       *  Depending on the size, will compress image, saves to SharePoint
       * @param {object} FileInfo 
       * @param {function} success Use this function to swap the url 
       * @param {function} fail 
       */
      function images_upload_handler(FileInfo, success, fail) {
        var blob = FileInfo.blob();

        // We're not going to compress images in IE since compression is too unstable 
        handleImageCompression(FileInfo)
          .then(function (img) {
            uploadImageToSharePoint(img.binary, img.filename, undefined, success, false);
          });

      }

      /*
      Currently not in use
      */
      function paste_postprocess(plugin, args) {
        var src = args.node.innerHTML.match(/blob.+[^">]/)[0];
        var browser = checkForChrome();
        //var filename = renameFile(file.name); // Need to get file info
        if (!browser) {
          compressImgSvc.loadImage(src)
            .then(function blobToArrayBufferSuccess(img) {
              return compressImgSvc.reduceImgUsingDataURL(img);
            })
            .then(function bufferToBinarySuccess(binary) {
              uploadImageToSharePoint(binary, filename, bloburi);
            });
        } else {
          compressImgSvc.compressImage(blobInfo)
            .then(function (binary) {
              uploadImageToSharePoint(binary, filename, undefined, success);
            });
        }
      }

      // HASHTAGS & MENTIONS
      function hashtags_menu_complete(editor, userinfo) {
        var span = editor.getDoc().createElement('span');
        span.className = 'hashtag-insert';
        span.innerHTML = '<span class="hashtag">' + userinfo.fullName.replace(' (new)', '') + '</span>';
        return span;
      }

      function hashtags_fetch(query, success) {
        socialDataSvc
          .getSiteHashtags(false, query.term)
          .then(function (hashtags) {
            var term = '#' + query.term;
            var showTemp = false;
            var tagsArr = [];
            var set = false;
            var i = 0;
            if (hashtags.length == 0) {
              // EMPTY ARRAY
              tagsArr.push({
                name: query.term.replace('#', ''),
                status: 'new',
                fullName: term + ' (new)',
                id: String(tagsArr.length)
              });
              success(tagsArr);
              return;
            }

            if (common.isArray(hashtags)) {
              hashtags.forEach(function (tag) {
                if (checkHashtag(tag)) {

                  // Existing Hashtags
                  tagsArr.push({
                    name: term.replace('#',''), // tag.name.replace('#', ''),
                    status: 'existing',
                    fullName: tag.name,
                    id: String(i)
                  });
                  if (term.toLowerCase() !== tag.name.toLowerCase()) {
                    showTemp = true;
                  } else if (term.toLowerCase() === tag.name.toLowerCase() && !set) {
                    showTemp = false;
                    set = true;
                    return;
                  }
                  i++;
                }
              });
            }
            if (showTemp && !set) {
              // New Hashtag
              tagsArr.unshift({
                name: query.term.replace('#', ''),
                status: 'new',
                fullName: term + ' (new)',
                id: String(tagsArr.length)
              });

            }

            success(tagsArr);
          });

        function checkHashtag(tag) {
          var tag = tag.name.replace('#', '');
          return tag.toLowerCase().startsWith(query.term.toLowerCase()) ? true : false;
        }

      }

      function mentions_fetch(query, success, editor) {
        socialDataSvc
          .getAllUsers()
          .then(function (localWCUsers) {
            var m = [];
            var i = 0;
            localWCUsers.forEach(function (user) {
              var fullName = user.firstname.toLowerCase() + user.lastname.toLowerCase();
              fullName = fullName.replace(/\s/g, '');
              if (fullName.startsWith(query.term.toLowerCase()) ||
                user.lastname.toLowerCase().startsWith(query.term.toLowerCase())
                /*|| user.networklogin.toLowerCase().startsWith(query.term.toLowerCase())*/
              ) {
                m.push({
                  timekeeperId: String(user.timekeeperid),
                  fullName: user.name,
                  networklogin: user.networklogin,
                  name: user.name,
                  sharepointid: user.sharepointid,
                  id: String(i)
                });
              }
              i++;
            });
            success(m);
          });
      }

      function openAssetDialog() {
        // Dialog Options:
        // https://docs.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ms543215(v=office.14)
        var DefaultAssetImageLocation = _spPageContextInfo.webServerRelativeUrl + "/PublishingImages";
        var DisplayLookInSection = false;
        var OverrideDialogTitle = 'Select Image';
        var OverrideDialogDescription = 'Select Image from SharePoint';
        var OverrideDialogImageUrl = '';
        var UseImageAssetPicker = true;
        var ValidateUrl = true;
        var webUrl = (_spPageContextInfo.webServerRelativeUrl.lastIndexOf("/") == _spPageContextInfo.webServerRelativeUrl.length-1) ? _spPageContextInfo.webServerRelativeUrl : _spPageContextInfo.webServerRelativeUrl + "/";
        var url = webUrl + "_layouts/15/AssetImagePicker.aspx?DefaultAssetLocation=&DefaultAssetImageLocation='" +
          DefaultAssetImageLocation + "&DisplayLookInSection=" + DisplayLookInSection + "&DefaultToLastUsedLocation=false&ManageHyperlink=false&DisplayWidth=&DisplayHeight=" +
          "&RenditionId=&AllowExternalUrls=false&OverrideDialogImageUrl=" + OverrideDialogImageUrl + "&AssetType=&OverrideDialogTitle=" + OverrideDialogTitle + "&OverrideDialogDescription=" + OverrideDialogDescription + "&ReturnItemFields=&AssetText=&" +
          "UseImageAssetPicker=" + UseImageAssetPicker + "&Height=0&Width=0&Border=0&HSpacing=&VSpacing=&" +
          "Alignment=&Hyperlink=&Target=&ManageLinkDisplayText=false&ValidateUrl =" + ValidateUrl + "&UseDefaultSize=true&IsDlg=1"
        var options = {
          //url: SP.Utilities.Utility.getLayoutsPageUrl(application_page_url),
          url: url,
          allowMaximize: false,
          showMaximized: false,
          showClose: true,
          height: 700,
          top: 240,
          autoSizeStartWidth: true,
          title: "Select Image",
          // Frequently developers create a delegate which refer an external method;
          // but I prefer handle it inside my method; 
          dialogReturnValueCallback: Function.createDelegate(null, function (result, returnValue) {
            if (result == SP.UI.DialogResult.OK) {
              if (returnValue == null) {
                SP.UI.Notify.addNotification('Operation successful');
                SP.UI.ModalDialog.RefreshPage(SP.UI.DialogResult.OK);
              } else {
                // location.href = urlCompleto;
                createImgForTinyContent(returnValue.AssetUrl);
              }
            }
          })

        };
        SP.UI.ModalDialog.showModalDialog(options);
      }

      function promptForHashtag() {
        // Prompt to turn into hashtag:
        // hashtags_menu_complete()
        if (wc.hashtag.length > 0) {
          angular.element('#wcModal').modal('show');
          wc.hashtag = "";
          wc.counter = 0;
        }
      }

      function setupTiny(editor) {
        //runs after tinymce loaded
        editor.addMenuItem('imageFromSP', {
          text: "Image from SharePoint",
          context: "insert",
          onclick: openAssetDialog,
          icon: 'fa-file-image'
        });
        editor.addMenuItem('fileToSP', {
          text: "File",
          context: "insert",
          onclick: uploadFile,
          icon: 'fa-file'
        });

        editor.on('PastePreProcess', function (e) {
          if (/^<img>.*<\/img>$/.test(e.content)) {
            try {
              e.preventDefault();
              e.stopPropagation();
              this.selection.setNode(e.content);

            } catch (error) {
              go.handleError(error);
            }
          } else if ((/^<img src="blob* >$/.test(e.content))) {

          } else if (/^&lt;iframe.*&lt;\/iframe&gt;$/.test(e.content)) {
            try {
              var content = "",
                $content = "";
              content = e.content;
              e.preventDefault();
              e.stopPropagation();
              content = common.decodeHTML(content);
              $content = angular.element(content);
              this.selection.setNode($content[0]);
            } catch (error) {
              go.handleError(error);
            }
          }

          function getClipBoardContent(editor) {
            if (pasteFromClipboard.indexOf("<iframe") == 0) {
              e.preventDefault();
              e.stopPropagation();
              /******************************************************
               *  LOGIC FOR GRABBING IFRAME VIDEO FROM CLIPBOARD
               *******************************************************/
              var iframeAttr = {};
              var iframe = {};
              var height = 0;
              var width = 0;
              var $clipboardElement = angular.element(pasteFromClipboard); // Should be an iframe element
              //var $iframe = $($clipboardElement[0].outerHTML);
              width = Number($clipboardElement[0].width);
              height = Number($clipboardElement[0].height);
              if (width > 1000 || height > 1000) {
                $clipboardElement[0].width = String(width / 2)
                $clipboardElement[0].height = String(height / 2)
              }
              $clipboardElement.removeAttr('allow');
              $clipboardElement.attr('allowfullscreen');
              editor.selection.setNode($clipboardElement);
              iframeWindows++;
            }
          }
        });
        // editor.on('PastePostProcess', function (e) {
        // });
        editor.on('init', function (args) {
          if (options.hideToolbar) {
            angular.element("div.mce-toolbar-grp").hide();
          }
        });

        editor.on('KeyDown', function handleKeyPress(e) {
          if (e.keyCode == 8 || e.keyCode == 46) { // delete & backspace keys
            var content = this.selection.getContent();
            var selectedNode = this.selection.getNode();

            if (content != "") {
              if (content.length > 0 && content.indexOf("<img") >= 0) {
                // DELETE IMAGE FROM SHAREPOINT. ELSE DO NOTHING.
                deleteImageFromSP();
                this.selection.setContent('');
              }

            } else if (selectedNode.innerHTML.indexOf("<img") >= 0) {
              deleteImageFromSP(selectedNode.childNodes[0]);
              this.selection.setContent('');
            }
          }

        });
      }

      /**
       * Used by TinyMCE to upload documents. This function loads Sharepoint's File dialog box
       * By default, documents are uploaded to the Documents library
       */
      function uploadFile() {

        var dialogOptions = {};
      //   var dialogArgs = {
      //     IsGeneralUpload: true
      //     // WftForm: formName,
      //     // WftId: workflowTypeId,
      //     // WftColor: formColor
      // };
        // SETUP DIALOG OPTIONS
        dialogOptions = {
          args: "", // Stuff to pass to the dialog
          autoSize: true,
          dialogReturnValueCallback: dialogReturnValueCallback,
          // dialogReturnValueCallback: Function.createDelegate(null,dialogReturnValueCallback),
          showClose: true,
          title: "Upload a file",
          url: L_Menu_BaseUrl + "/_layouts/upload.aspx"
        }
        // https://docs.microsoft.com/en-us/previous-versions/office/developer/sharepoint-2010/ff410058(v%3Doffice.14)
        SP.UI.ModalDialog.showModalDialog(dialogOptions);

        $timeout(function () {
          //finds the upload choice dialog box and set the documents library as the default
          var dlg = SP.UI.ModalDialog.get_childDialog();
          if (dlg != null) {
            var dlgWin = angular.element("html", window.parent.document);
            //get the iframe with the select box
            var dlgCont = angular.element(dlgWin).find("#dialogTitleSpan:contains('Upload a file')").parent().parent().parent().find('iframe');
            //Set Documents as the default library.  
            // The value corresponds to the selection you want marked as default.
            var context = new SP.ClientContext.get_current();
            var web = context.get_web();
            var list = web.get_lists().getByTitle('Documents');
            context.load(list, 'Id');

            context.executeQueryAsync( //submit query to the server
              function () {
                var listId = list.get_id();
                angular.element(dlgCont).contents().find("#ctl00_PlaceHolderMain_SelectListSection_ctl01_AvailableDocLibs option:not([value=" + listId.toLocaleString() + "])").remove();
                // console.log("ID:" + list.get_id(), listId); //process result in success callback
              },
              function (sender, args) {

              }
            );

          }
        }, 1250, false);

        function dialogReturnValueCallback(result, returnValue) {
          if (result == SP.UI.DialogResult.OK) {
            // Get the file path and extract the filename from it.
            var fileURL = returnValue.newFileUrl;
            var filenameArray = fileURL.split("/");
            var filenamePosition = filenameArray.length;
            var theFileName = filenameArray[filenamePosition - 1];

            // Display an icon before the file link. Start with default paperclip and check for a few common types
            var ext = common.getFileExtension(theFileName);

            // set default icon
            var icon = '/_layouts/15/images/ATTACH16.PNG';
            if (!returnValue.newFileIcon) {
              // check for excel
              if ('.xls' == ext || '.xlsx' == ext) {
                icon = '/_layouts/15/images/ICXLS.PNG';
              }
              // check for ms document
              else if ('.docx' == ext || '.doc' == ext) {
                icon = '/_layouts/15/images/icdocx.png';
              }
              // check for powerpoint
              else if ('.ppt' == ext || '.pptx' == ext) {
                icon = '/_layouts/15/images/PPT16.GIF';
              }
            } else {
              icon = '/_layouts/15/images/' + returnValue.newFileIcon;
            }

            // create the html to dipslay the file icon
            var thumbnail = '<img class="ms-asset-icon" src="' + icon + '">';
            // Create the clickable hyperlink to the file attachment
            var FileLink = "<a href=\"" + fileURL + "\">" + thumbnail + " " + theFileName + "</a>";
            //adds the link to the body of the discussion post  
            // $('.ms-rtestate-write').append(FileLink);
            angular.element('.ms-authoringcontrols').append(FileLink);
            var localAElm = document.createElement("a");
            localAElm.innerHTML = FileLink;
            tinyMCE.activeEditor.selection.setNode(localAElm);
          }
        }
      }

      /**
       * This funciton uploades image to SharePoint. The challenge is swapping the new url on the DOM with the one saved on SharePoint, especially in Tiny's DOM
       *  To take care of these challenges, added a few more parameters to help with swapping file paths.
       * @param {binary} binary   image in binary format for how SharePoint expects it.
       * @param {string} filename   name of file
       * @param {string} uri  optional uri as a blob path. 
       * @param {function} success  Tiny's success callback function for swapping filenames, used in  images_upload_handler()
       * @param {boolean} useCB useCB callback used by
       */
      function uploadImageToSharePoint(binary, filename, uri, success, useCB) {
        useCB = useCB || false;
        var url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/getfolderbyserverrelativeurl('" + _spPageContextInfo.webServerRelativeUrl + "/PublishingImages')/files/Add(url='" + filename + "',overwrite=true)";
        var createItem = new SP.RequestExecutor(_spPageContextInfo.webAbsoluteUrl);
        createItem.executeAsync({
          url: url,
          headers: {
            'X-RequestDigest': $('#__REQUESTDIGEST').val(),
            accept: 'application/json; odata=verbose',
            'content-type': 'application/json; odata=verbose'
          },
          method: "POST",
          binaryStringRequestBody: true,
          body: binary,
          success: function (result) {
            if (result) {
              var body = {}
              body = SP_JSONParse(result.body);
              body = body.d;
              // Swap the url for the image in Tiny with the relative path in SharePoint. 
              if (typeof success == "function") success(body.ServerRelativeUrl);
              if (tinymce.activeEditor) {
                var currentEditor = tinymce.activeEditor;
                var currentContent = currentEditor.getContent();
                if (currentContent.indexOf(body.Name) < 0) {
                  var img = "<img src ='" + body.ServerRelativeUrl + "' / >";
                  var imgElm = document.createElement("img");
                  imgElm.src = body.ServerRelativeUrl;
                  var pos = currentContent.indexOf('src="' + uri + '"');
                  if (uri && pos >= 0) {
                    // uri is a blob and it exists in tinyMCE's content, swap it with new url
                    var endOfImgPos = currentContent.indexOf(">", pos);
                    currentContent = currentContent.splice(pos, endOfImgPos - pos, img);
                    // currentEditor.setContent(currentContent);
                    tinymce.activeEditor.selection.setContent(img);
                    //tinyMCE.activeEditor.setProgressState(false);
                  } else if (pos < 0 && !useCB) {
                    // blobinfo is not in Tiny's DOM. 
                    // Not using callback. Insert the image.
                    // currentEditor.selection.setNode(imgElm);
                    //tinyMCE.activeEditor.setProgressState(false);
                    // updateSourceUrl();
                  } else if (!useCB) {
                    var pos = currentContent.lastIndexOf("</p>");
                    currentContent = currentContent.splice(pos, 0, img);
                    // currentEditor.setContent(currentContent);
                    // tinymce.activeEditor.selection.setContent(img);
                    //tinyMCE.activeEditor.setProgressState(false);
                    //updateSourceUrl();
                  } else if (useCB) {
                    useCB(imgLibUrl + "/" + filename, {
                      title: filename,
                      name: filename,
                      alt: filename
                    });
                    //tinyMCE.activeEditor.setProgressState(false);
                    //updateSourceUrl();
                  } else {
                    currentEditor.setContent(currentContent);

                  }
                }
              }
              // Hide progress for the active editor
              tinyMCE.activeEditor.setProgressState(false);
            }
            // Hide progress for the active editor
            tinyMCE.activeEditor.setProgressState(false);


          },
          error: function (e) {
            go.handleError(e);
          },
          state: "Update"
        });
      }

      function updateSourceUrl(filename) {
        if (!filename) return;
        var imageWindow = tinyMCE.activeEditor.windowManager.windows; //.$el
        var fullPath = images_upload_url + "/" + filename;
        if (imageWindow.length > 0) {
          imageWindow = imageWindow[0];
          if (imageWindow.features.title == "Insert/edit image") {
            // Found the right window.
            // Lets grab the element
            var $imageWindow = angular.element(imageWindow.$el)
            if ($imageWindow.find("input").val() == "") {
              // Update textbox with image url
              $imageWindow.find("input").val(fullPath);
            }

          }
        }
      }



      function addCustomOnCloseToTiny(window) {
        console.log(window);
      }

      function successHandler(result) {
        if (result) {
          if (result.body) {
            var body = JSON.parse(result.body);
            if (body.d.Recycle) {
              // console.log("Image Recycled", body.d.Recycle)
            }
          }
        }
      }

      function errorHandler(err) {
        go.handleError(err);
      }

      function createImgForTinyContent(url) {
        // pass me url of image and i'll add it to Tiny
        if (tinymce.activeEditor) {
          var currentEditor = tinymce.activeEditor;
          var currentContent = currentEditor.getContent();
          if (currentContent.indexOf(url) < 0) {
            var img = "<img src ='" + url + "' / >";
            var pos = currentContent.lastIndexOf("</p>");
            currentContent = currentContent.splice(pos, 0, img);
            currentEditor.setContent(currentContent);
          }
        }
      }

      // HELPER FUNCTIONS

      function detectMobile() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          // Mobile device
          return true;
        } else {
          return false;
          //window.addEventListener("resize", sideNavClose);
        }
      }

      /**
       * Used to rename files with spid+date.
       * This prevents overiding files, gives a unique name, and allows us to trace the file back to the end user and datetime of upload.
       * @param {string} filename 
       *  Returns string with new filename.
       */
      function renameFile(filename, originalType) {
        // JPEG IS A SAFE EXTENSION TO USE
        var ext = (filename) ? common.getFileExtension(filename) : ".jpeg";

        // IE SETS FILES AS *.DAT WHEN IT HAS TROUBLE INTERPRETING
        if (originalType) {
          ext = (originalType.indexOf("bmp") >= 0) ? ".bmp" : ext;
        }
        var currentDate = new Date();
        return _spPageContextInfo.userId + "_" + currentDate.getTime() + ext;
      }

      function checkForChrome() {
        // https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome/13348618#13348618
        // please note, 
        // that IE11 now returns undefined again for window.chrome
        // and new Opera 30 outputs true for window.chrome
        // but needs to check if window.opr is not undefined
        // and new IE Edge outputs to true now for window.chrome
        // and if not iOS Chrome check
        // so use the below updated condition
        var isChromium = window.chrome;
        var winNav = window.navigator;
        var vendorName = winNav.vendor;
        var isOpera = typeof window.opr !== "undefined";
        var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
        var isIOSChrome = winNav.userAgent.match("CriOS");

        if (isIOSChrome) {
          // is Google Chrome on IOS
          return true;
        } else if (
          isChromium !== null &&
          typeof isChromium !== "undefined" &&
          vendorName === "Google Inc." &&
          isOpera === false &&
          isIEedge === false
        ) {
          // is Google Chrome
          return true;
        } else {
          // not Google Chrome 
          return false;
        }
      }

      return tinymce.init(tinyOptions)

    }

    return returnTinymce;
  }

})();