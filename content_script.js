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

function getJSON(url, fn) {
  get(url, 'json', fn);
}

function getXML(url, fn) {
  get(url, 'document', fn);
}

function replaceVideo() {
  getJSON(location.pathname + '.json', function(videoJson) {
    var seriesId = videoJson.seriesHouseNumber;
    getXML('/feed/wd/?series=' + seriesId, function(seriesXml) {
      var items = seriesXml.querySelectorAll('item');
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        if (item.querySelector('link').textContent == location.href) {
          var media = document.createElement('video');
          media.src = item.querySelector('videoAsset').textContent;
          media.preload = 'auto';
          media.poster = videoJson.thumbnail;
          media.controls = true;
          media.setAttribute('width','100%');
          media.setAttribute('height','100%');

          if (videoJson.captions) {
            get(videoJson.captions, 'text', function(captions) {
              var fixedCaptions = captions.replace(/(\d+):(\d+):(\d+):(\d+)/g, '$1:$2:$3.$40').replace(/<br>/g, '\n');
              var captionsBlob = new Blob([fixedCaptions], {type: 'text/vtt'});
              var captionTrack = document.createElement('track');
              captionTrack.src = URL.createObjectURL(captionsBlob);
              captionTrack.kind = 'captions';
              captionTrack.default = true;
              captionTrack.srclang = 'en';
              media.appendChild(captionTrack);
            });
          }

          var playerDiv = document.querySelector('#playerDiv');
          document.querySelector('#playerDiv').innerHTML = '';
          document.querySelector('#playerDiv').classList.add('html5');
          document.querySelector('#playerDiv').appendChild(media);

          break;
        }
      }
    });
  });
}

if (/^\/programs\/[^\/]+?\/.+/.test(location.pathname)) { replaceVideo(); }

document.body.classList.add('html5-video');
