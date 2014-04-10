function get(url, responseType, fn) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('Authorization', 'Basic ZmVlZHRlc3Q6YWJjMTIz');
  xhr.responseType = responseType;
  xhr.onload = function() {
    fn(xhr.response);
  };
  xhr.send();
}

function animateScroll(x, y, duration) {
  var FPS = 50;
  var start, lastTs, xStep, yStep;
  var calculate = function(ts) {
    if (!start) { start = ts; }
    var progress = ts - start;
    var delta = ts - lastTs;
    FPS = 1000 / delta;
    lastTs = ts;
    var steps = (FPS / 1000) * (duration - progress);
    xStep = Math.min(x / steps, x - window.pageXOffset);
    yStep = Math.min(y / steps, y - window.pageYOffset);
    console.log('delta=%d, progress=%d, steps=%d, xStep=%d, yStep=%d', delta, progress, steps, xStep, yStep);
  };
  var animate = function(ts) {
    console.log('animate() ', ts);
    calculate(ts);

    if (window.pageXOffset < x || window.pageYOffset < y) {
      requestAnimationFrame(animate);
    }

    window.scrollBy(xStep, yStep);
  };
  requestAnimationFrame(animate);
}

function getJSON(url, fn) {
  get(url, 'json', fn);
}

function getXML(url, fn) {
  get(url, 'document', fn);
}

function replaceWatchNowButtons() {
  Array.prototype.forEach.call(document.querySelectorAll('a.watch-now-button'), function(a) {
    a.href += '?autoplay=true';
  });
}

function replaceVideo() {
  var href = location.href.split('?');
  getJSON(location.pathname + '.json', function(videoJson) {
    var seriesId = videoJson.seriesHouseNumber;
    getXML('https://iview.abc.net.au/feed/wd/?series=' + seriesId, function(seriesXml) {
      var items = seriesXml.querySelectorAll('item');
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (item.querySelector('link').textContent == href[0]) {
          var media = document.createElement('video');
          media.src = item.querySelector('videoAsset').textContent;
          media.preload = 'auto';
          media.autoplay = /autoplay=true/.test(href[1]);
          media.poster = videoJson.thumbnail;
          media.classList.add('video-js', 'vjs-default-skin');
          media.controls = true;
          media.setAttribute('width','100%');
          media.setAttribute('height','100%');

          var video;
          media.addEventListener('playing', function() {
            document.body.classList.add('playing');
            if (0 === window.pageYOffset) {
              animateScroll(0, 150, 500);
            }
            media.parentNode.style.height = Math.round(media.offsetWidth * (media.videoHeight / media.videoWidth)) + 'px';
          });

          media.addEventListener('ended', function() {
            document.body.classList.remove('playing');
            media.parentNode.style.height = '100%';
            video.currentTime(0);
            video.bigPlayButton.show();
            video.posterImage.show();
          });

          if (videoJson.captions) {
            get(videoJson.captions, 'text', function(captions) {
              var fixedCaptions = captions.replace(/(\d+):(\d+):(\d+):(\d+)/g, '$1:$2:$3.$40').replace(/<br>/g, '\n');
              var captionsBlob = new Blob([fixedCaptions], {type: 'text/vtt'});
              var captionTrack = document.createElement('track');
              captionTrack.src = URL.createObjectURL(captionsBlob);
              captionTrack.kind = 'captions';
              captionTrack.srclang = 'en';
              captionTrack.setAttribute('label', 'English');
              media.appendChild(captionTrack);

              // delay init of videojs until captions are here otherwise it doesn't display them
              var videoWrapperPosition = document.querySelector('.video-wrapper-position');
              videoWrapperPosition.insertBefore(media, videoWrapperPosition.firstChild);
              video = videojs(media);
            });
          } else {
            var videoWrapperPosition = document.querySelector('.video-wrapper-position');
            videoWrapperPosition.insertBefore(media, videoWrapperPosition.firstChild);
            video = videojs(media);
          }

          document.body.classList.add('ready');

          break;
        }
      }
    });
  });
}

document.body.classList.add('html5-video');

replaceWatchNowButtons();

if (/^\/programs\/[^\/]+?\/.+/.test(location.pathname)) { replaceVideo(); }
