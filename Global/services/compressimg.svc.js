(function () {
  "use strict";

  reconnectApp.factory("compressImgSvc", compressImgSvc);

  /** @ngInject */
  compressImgSvc.$inject = ["$q", "go"];

  // var hasBlobConstructor =
  //   window.Blob &&
  //   (function () {
  //     try {
  //       return Boolean(new Blob());
  //     } catch (e) {
  //       return false;
  //     }
  //   })();

  function compressImgSvc($q, go) {

    // var worker = new Worker("compresssimg.webworker.js");
    // worker.addEventListener("message",workerFunction);
    function workerFunction() {
      // console.log("Worker said: " , e.data);
    }

    // function Scope() {
    //   this.$$watchers = [];
    // }

    // Scope.prototype.$watch = function (watchFn, listenerFn) {
    //   var watcher = {
    //     watchFn: watchFn,
    //     listenerFn: listenerFn || function () {}
    //   };
    //   this.$$watchers.push(watcher);
    // }

    // Scope.prototype.$digest = function () {
    //   var self = this;
    //   this.$$watchers.forEach(function (watch) {
    //     var newValue = watch.watchFn(self);
    //     var oldValue = watch.last;
    //     if (newValue !== oldValue) {
    //       watch.listenerFn(newValue, oldValue, self);
    //       watch.last = newValue;
    //     }
    //   });
    //   dirty && cb && cb(this);
    // }

    return {
      blobToArrayBuffer: blobToArrayBuffer,
      bufferToBinary: bufferToBinary,
      compressImage: compressImage,
      dataURLtoBlob: dataURLtoBlob,
      drawImageInCanvas: drawImageInCanvas,
      getFileFromDataUrl: getFileFromDataUrl,
      getDataUrlFromFile: getDataUrlFromFile,
      reduceImgUsingDataURL: reduceImgUsingDataURL,
      loadImage: loadImage,
      resizeBase64Img: resizeBase64Img
    };

    function blobToArrayBuffer(imgInfo) {
      return $q(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function (e) {
          resolve(e.target.result);
        };
        reader.onerror = function (e) {
          reject(e.target.error);
        };
        reader.readAsArrayBuffer(imgInfo);
      });
    }

    function bufferToBinary(buffer) {
      return $q(function (resolve, reject) {
        try {
          var binary = "";
          var bytes;
          bytes = new Uint8Array(buffer);
          for (var b = 0; b < bytes.length; b++) {
            binary += String.fromCharCode(bytes[b]);
          }
          resolve(binary);
        } catch (error) {
          go.handleError(error);
          reject(error);
        }
      });
    }

    /**
     * Compress image function. 
     *
     * @param {*} imgAsBlob
     * @param {*} maxWidth
     * @param {*} maxHeight
     * @returns Returns image as a binary wrapped in a promise.
     */
    function compressImage(imgAsBlob, maxWidth, maxHeight) {
      return $q(function (resolve, reject) {
        try {
          var type = imgAsBlob.type;
          getDataUrlFromFile(imgAsBlob)
            .then(function getDataUrlFromFileSuccess(dataUrl) {
              return loadImage(dataUrl);
            })
            .then(function loadImageSuccess(img) {
              return reduceImgUsingDataURL(img, maxWidth, maxHeight, 50, type, "Blob");
            })
            .then(function reduceImgSuccess(imgAsBlob) {
              return blobToArrayBuffer(imgAsBlob);
            })
            .then(function blobToArrayBufferSuccess(buffer) {
              return bufferToBinary(buffer);
            })
            .then(function bufferToBinarySuccess(binary) {
              return resolve(binary);
            })
            .catch(function (e) {
              go.handleError(e);
              reject(e);
            });
        } catch (error) {
          go.handleError(error);
          reject(error);
        }
      });
    }

    /**
     * Used to convert encoded url form of image data into blob datatype.
     * @param {string} dataURL 
     *  Returns blob
     */
    function dataURLtoBlob(dataURL) {
      // Convert base64/URLEncoded data to raw binary data.
      var byteString, mime;
      if (dataURL.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURL.split(',')[1]);
      } else {
        byteString = unescape(dataURL.split(',')[1]);
      }
      mime = dataURL.split(',')[0].split(':')[1].split(';')[0];

      // Convert bytes to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var index = 0; index < byteString.length; index++) {
        ia[index] = byteString.charCodeAt(index);
      }

      return new Blob([ia], {
        type: mime
      })
    }

    function drawImageInCanvas(img, maxWidth, maxHeight) {
      return $q(function (resolve, reject) {
        var canvas = document.createElement("canvas");
        try {
          maxWidth = Number(maxWidth);
        } catch (error) {
          // maxWidth is not a number
          go.handleError(error);
          reject(error);
        }
        try {
          maxHeight = Number(maxHeight);
        } catch (error) {
          // maxHeight is not a number
          go.handleError(error);
          reject(error);
        }
        if (img.width > maxWidth || img.height > maxHeight) {
          if (img.width > img.height) {
            canvas.width = maxWidth;
            canvas.height = (img.height / img.width) * maxHeight;
          } else {
            canvas.width = (img.width / img.height) * maxWidth;
            canvas.height = maxHeight;
          }
        } else if (!maxWidth || !maxHeight) {
          canvas.width = img.width / 4;
          canvas.height = img.height / 4;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        try {
          var ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // var img1 = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // var pixelData = img1.data;
          // var len = pixelData.length;

          // var newImg = ctx.createImageData(canvas.width, canvas.height);
          // for (var i = 0; i < newImg.data.length; i++) {
          //     newImg.data[i] = img1.data[i];
          // }

          // ctx.putImageData(newImg, 0, 0);

          // ctx.drawImage(img, 0, 0);
          // var buffer = img1.data.buffer;
          canvas.toBlob(function (blob) {
            resolve(blob);
          })
        } catch (error) {
          // Unable to draw the image. Likely img passed in was bad.
          go.handleError(error);
          reject(error);
        }
      });
    }

    function getFileFromDataUrl(dataurl, filename, lastMod) {
      if (!lastMod) {
        lastMod = Date.now();
      }
      return $q(function (resolve, reject) {
        try {
          var arr = dataurl.split(",");
          var mime = arr[0].match(/:(.*?);/)[1];
          var bstr = atob(arr[1]);
          var len = bstr.length;
          var u8arr = new Uint8Array(len);
          while (len--) {
            u8arr[len] = bstr.charCodeAt(len);
          }
          var file;
          try {
            file = new File([u8arr], filename, {
              type: mime
            }); // Some browsers might not support File constructor
          } catch (error) {
            file = new Blob([u8arr], {
              type: mime
            });
            file.name = filename;
            file.lastModified = lastMod;
            go.handleError(error);
          }
          resolve(file);
        } catch (error) {
          reject(error);
          go.handleError(error);
        }
      });
    }

    /**
     *  Calculates the aspect ratio and reassigns new height/width to the canvas.
     * @param {HTMLImageElement} img 
     *  Returns a canvas adjusted for aspect ratio. 
     */
    function handleImageSize(img) {
      var cvs = document.createElement('canvas');
      var ctx = cvs.getContext("2d");

      var height = img.height;
      var width = img.width;
      // Usually the width is greater than the height while in Tiny
      // So it works out well to rely on the innerWidth to use for calculating the ratio.
      // var w = window.innerWidth;
      // var h = window.innerHeight;
      // Average screen resolution 1920x1080
      var avgScreenResW = 1920
      var avgScreenResH = 1080;
      var w = avgScreenResW;
      var h = avgScreenResH;
      var adjH = 0,
        adjW = 0;

      if (height > width) {
        adjW = w;
        adjH = (height / width) * w;
      } else if (width > height) {
        adjW = w;
        adjH = (height / width) * w;
      } else {
        adjW = w;
        adjH = h;
      }
      //   ctx.canvas.width = adjW;
      //   ctx.canvas.height = adjH;
      return ctx;
    }

    
    function imgToBlob(img, quality) {
      return $q(function (resolve, reject) {
        try {
          var cvs = document.createElement('canvas');
          var ctx = cvs.getContext("2d");
          var mime_type = "image/jpeg";
          quality = quality || 100;
          quality = quality / 100;
          ctx.mozImageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.webkitImageSmoothingEnabled = true;
          ctx.msImageSmoothingEnabled = true;
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          var result_image_obj = new Image();
          switch (return_type) {
            case 'Blob':
              if (cvs.toBlob) {
                cvs.toBlob(function (blob) {
                  resolve(blob);
                }, mime_type, quality);
              } else {
                // IE FIX
                var blob = cvs.msToBlob();
                if (blob) {
                  resolve(blob);
                } else {
                  reject(blob);
                }
              }
              break;
            default:
              resolve(result_image_obj);
              break;
          }
        } catch (error) {
          go.handleError(error)
          reject(error);
        }
      });
    }

    /**
     * 
     * @param {*} img 
     * @param {*} quality 
     * @param {*} output_type 
     * @param {string} return_type values are Blob,DataURL, Img
     */
    function reduceImgUsingDataURL(img, maxWidth, maxHeight, quality, output_type, return_type) {
      return $q(function (resolve, reject) {
        try {
          maxWidth = (maxWidth) ? maxWidth : 2000;
          maxHeight = (maxHeight) ? maxHeight : 2000;
          quality = (quality) ? quality : 50;
          output_type = (output_type) ? output_type : img.type;
          var mime_type;
          //   if (output_type.indexOf("png") >= 0) {
          //       mime_type = "image/png";
          //   } else if (output_type.indexOf("webp") >= 0) {
          //       mime_type = "image/webp";
          //   } else if (output_type.indexOf("gif") >= 0){
          //       mime_type = "image/gif";
          //   }
          //   else {
          //       mime_type = "image/jpeg";
          //   }
          // FORCE "image/jpeg"
          mime_type = "image/jpeg";
          var cvs = document.createElement('canvas');
          cvs.width = img.width;
          cvs.height = img.height;
          var ctx = cvs.getContext("2d");
          ctx.imageSmoothingQuality = "high";
          ctx.mozImageSmoothingEnabled = true;
          ctx.webkitImageSmoothingEnabled = true;
          ctx.msImageSmoothingEnabled = true;
          ctx.imageSmoothingEnabled = true;
          // Note: Images can become blurry when scaling up or grainy if they're scaled down too much. 
          // Scaling is probably best not done if you've got some text in it which needs to remain legible.
          //ctx.drawImage(img, 0, 0, ScaleX, ScaleY);
          ctx.drawImage(img, 0, 0);
          cvs = ctx.canvas;
          var result_image_obj = new Image();

          switch (return_type) {
            case 'Blob':
              if (cvs.toBlob) {
                cvs.toBlob(function (blob) {
                  resolve(blob);
                }, mime_type, quality / 100);
              } else {
                // IE FIX
                var blob = cvs.msToBlob();
                if (blob) {
                  resolve(blob);
                } else {
                  reject(blob);
                }
              }
              break;
            case 'DataURL':
              var newImageData = cvs.toDataURL(mime_type, quality / 100);
              resolve(newImageData);
              break;
            default:
              // return image
              resolve(result_image_obj);
              break;
          }
        } catch (error) {
          reject(error);
        }
      });
    }

    function getDataUrlFromFile(file) {
      var reader = new FileReader();
      return $q(function (resolve, reject) {
        reader.onload = function () {
          resolve(reader.result);
        };
        reader.onerror = function (e) {
          go.handleError(e);
          reader.abort();
          reject(e);
        };
        reader.readAsDataURL(file);
        if (reader.readyState == 2) {
          resolve(reader.result);
        }
      });
    }

    /**
     * Converts source url to image file to image object.
     * @param {string} src  source url for image.
     * Returns image object
     */
    function loadImage(src) {
      return $q(function (resolve, reject) {
        var img = document.createElement("img");
        img.onload = function () {
          resolve(img);
        };
        img.onerror = function (e) {
          go.handleError(e);
          reject(e);
        };
        img.src = (typeof src == "string") ? src : (src.name) ? _spPageContextInfo.webServerRelativeUrl + "/PublishingImages/" + src.name : "";
      });
    }

    /**
     * Do not use.
     * Not a 100% tested.
     * @param {*} base64 
     * @param {*} width 
     * @param {*} height 
     */
    function resizeBase64Img(base64, width, height) {
      width = (width) ? width : 768;
      height = (height) ? height : 1024;
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext("2d");
      return $q(function (resolve, reject) {
        //var img = new Image(width,height);
        var img = document.createElement("img");
        img.src = "data:image/jpeg;base64," + base64;
        // var $img = angular
        //     .element("<img/>")
        //     .attr("src", "data:image/jpeg;base64," + base64);
        img.addEventListener("load", function () {
          //img.onload(function () {
          //context.scale(width / this.width, height / this.height);
          context.drawImage(this, 0, 0);
          var url = canvas.toDataURL("image/jpeg", .50);
          this.setAttribute("src", url);
          resolve(this);
        });
        img.addEventListener("error", function () {
          //img.onerror(function (e) {
          reject(e);
        });
        img.addEventListener("ended", function () {
          //img.onended(function(){
          resolve(this);
        });
        //img.load();
      });
    }
  }
})();