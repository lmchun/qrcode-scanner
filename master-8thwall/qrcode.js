//
// Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import {Detector} from './detector'
import {Decoder} from './decoder'

const qrcode_ = {}
qrcode_.imagedata = null
qrcode_.width = 0
qrcode_.height = 0
qrcode_.qrcode_Symbol = null
qrcode_.debug = false
qrcode_.maxImgSize = 1024 * 1024

qrcode_.sizeOfDataLengthInfo = [[10, 9, 8, 8], [12, 11, 16, 10], [14, 13, 16, 12]]

qrcode_.callback = null

qrcode_.vidSuccess = function (stream) {
  qrcode_.localstream = stream
  if (qrcode_.webkit) {
    qrcode_.video.src = window.webkitURL.createObjectURL(stream)
  } else
  if (qrcode_.moz) {
    qrcode_.video.mozSrcObject = stream
    qrcode_.video.play()
  } else {
    qrcode_.video.src = stream
  }

  qrcode_.gUM = true

  qrcode_.canvas_qr2 = document.createElement('canvas')
  qrcode_.canvas_qr2.id = 'qr-canvas'
  qrcode_.qrcontext2 = qrcode_.canvas_qr2.getContext('2d')
  qrcode_.canvas_qr2.width = qrcode_.video.videoWidth
  qrcode_.canvas_qr2.height = qrcode_.video.videoHeight
  setTimeout(qrcode_.captureToCanvas, 500)
}

qrcode_.vidError = function (error) {
  qrcode_.gUM = false
}

qrcode_.captureToCanvas = function () {
  if (qrcode_.gUM) {
    try {
      if (qrcode_.video.videoWidth == 0) {
        setTimeout(qrcode_.captureToCanvas, 500)
        return
      } else {
        qrcode_.canvas_qr2.width = qrcode_.video.videoWidth
        qrcode_.canvas_qr2.height = qrcode_.video.videoHeight
      }
      qrcode_.qrcontext2.drawImage(qrcode_.video, 0, 0)
      try {
        qrcode_.decode()
      } catch (e) {
        console.log(e)
        setTimeout(qrcode_.captureToCanvas, 500)
      }
    } catch (e) {
      console.log(e)
      setTimeout(qrcode_.captureToCanvas, 500)
    }
  }
}

qrcode_.setWebcam = function (videoId) {
  const n = navigator
  qrcode_.video = document.getElementById(videoId)

  let options = true
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    try {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          devices.forEach((device) => {
            console.log('deb1')
            if (device.kind === 'videoinput') {
              if (device.label.toLowerCase().search('back') > -1) {
                options = [{'sourceId': device.deviceId}]
              }
            }
            console.log(`${device.kind}: ${device.label
            } id = ${device.deviceId}`)
          })
        })
    } catch (e) {
      console.log(e)
    }
  } else {
    console.log('no navigator.mediaDevices.enumerateDevices')
  }

  if (n.getUserMedia) {
    n.getUserMedia({video: options, audio: false}, qrcode_.vidSuccess, qrcode_.vidError)
  } else
  if (n.webkitGetUserMedia) {
    qrcode_.webkit = true
    n.webkitGetUserMedia({video: options, audio: false}, qrcode_.vidSuccess, qrcode_.vidError)
  } else
  if (n.mozGetUserMedia) {
    qrcode_.moz = true
    n.mozGetUserMedia({video: options, audio: false}, qrcode_.vidSuccess, qrcode_.vidError)
  }
}

qrcode_.decode = function (src) {
  if (arguments.length == 0) {
    if (qrcode_.canvas_qr2) {
      var canvas_qr = qrcode_.canvas_qr2
      var context = qrcode_.qrcontext2
    } else {
      var canvas_qr = document.getElementById('qr-canvas')
      var context = canvas_qr.getContext('2d')
    }
    qrcode_.width = canvas_qr.width
    qrcode_.height = canvas_qr.height
    qrcode_.imagedata = context.getImageData(0, 0, qrcode_.width, qrcode_.height)
    qrcode_.result = qrcode_.process(context)
    if (qrcode_.callback != null) {
      qrcode_.callback(qrcode_.result)
    }
    return qrcode_.result
  } else {
    const image = new Image()
    image.crossOrigin = 'Anonymous'
    image.onload = function () {
      // var canvas_qr = document.getElementById("qr-canvas");
      const canvas_out = document.getElementById('out-canvas')
      if (canvas_out != null) {
        const outctx = canvas_out.getContext('2d')
        outctx.clearRect(0, 0, 320, 240)
        outctx.drawImage(image, 0, 0, 320, 240)
      }

      const canvas_qr = document.createElement('canvas')
      const context = canvas_qr.getContext('2d')
      let nheight = image.height
      let nwidth = image.width
      if (image.width * image.height > qrcode_.maxImgSize) {
        const ir = image.width / image.height
        nheight = Math.sqrt(qrcode_.maxImgSize / ir)
        nwidth = ir * nheight
      }

      canvas_qr.width = nwidth
      canvas_qr.height = nheight

      context.drawImage(image, 0, 0, canvas_qr.width, canvas_qr.height)
      qrcode_.width = canvas_qr.width
      qrcode_.height = canvas_qr.height
      try {
        qrcode_.imagedata = context.getImageData(0, 0, canvas_qr.width, canvas_qr.height)
      } catch (e) {
        qrcode_.result = 'Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!'
        if (qrcode_.callback != null) {
          qrcode_.callback(qrcode_.result)
        }
        return
      }

      try {
        qrcode_.result = qrcode_.process(context)
      } catch (e) {
        console.log(e)
        qrcode_.result = 'error decoding QR Code'
      }
      if (qrcode_.callback != null) {
        qrcode_.callback(qrcode_.result)
      }
    }
    image.onerror = function () {
      if (qrcode_.callback != null) {
        qrcode_.callback('Failed to load the image')
      }
    }
    image.src = src
  }
}

qrcode_.isUrl = function (s) {
  const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  return regexp.test(s)
}

qrcode_.decode_url = function (s) {
  let escaped = ''
  try {
    escaped = escape(s)
  } catch (e) {
    console.log(e)
    escaped = s
  }
  let ret = ''
  try {
    ret = decodeURIComponent(escaped)
  } catch (e) {
    console.log(e)
    ret = escaped
  }
  return ret
}

qrcode_.decode_utf8 = function (s) {
  if (qrcode_.isUrl(s)) {
    return qrcode_.decode_url(s)
  } else {
    return s
  }
}

qrcode_.process = function (ctx) {
  const start = new Date().getTime()

  const image = qrcode_.grayScaleToBitmap(qrcode_.grayscale())
  // var image = qrcode_.binarize(128);

  if (qrcode_.debug) {
    for (var y = 0; y < qrcode_.height; y++) {
      for (var x = 0; x < qrcode_.width; x++) {
        var point = (x * 4) + (y * qrcode_.width * 4)
        qrcode_.imagedata.data[point] = image[x + y * qrcode_.width] ? 0 : 0
        qrcode_.imagedata.data[point + 1] = image[x + y * qrcode_.width] ? 0 : 0
        qrcode_.imagedata.data[point + 2] = image[x + y * qrcode_.width] ? 255 : 0
      }
    }
    ctx.putImageData(qrcode_.imagedata, 0, 0)
  }

  // var finderPatternInfo = new FinderPatternFinder().findFinderPattern(image);

  const detector = new Detector(image)

  const qrcode_Matrix = detector.detect()

  if (qrcode_.debug) {
    for (var y = 0; y < qrcode_Matrix.bits.Height; y++) {
      for (var x = 0; x < qrcode_Matrix.bits.Width; x++) {
        var point = (x * 4 * 2) + (y * 2 * qrcode_.width * 4)
        qrcode_.imagedata.data[point] = qrcode_Matrix.bits.get_Renamed(x, y) ? 0 : 0
        qrcode_.imagedata.data[point + 1] = qrcode_Matrix.bits.get_Renamed(x, y) ? 0 : 0
        qrcode_.imagedata.data[point + 2] = qrcode_Matrix.bits.get_Renamed(x, y) ? 255 : 0
      }
    }
    ctx.putImageData(qrcode_.imagedata, 0, 0)
  }

  const reader = Decoder.decode(qrcode_Matrix.bits)
  const data = reader.DataByte
  let str = ''
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      str += String.fromCharCode(data[i][j])
    }
  }

  const end = new Date().getTime()
  const time = end - start
  console.log(time)
  // console.log(str)

  return {
    found: true,
    foundText: qrcode_.decode_utf8(str),
    // foundText: str,
    points: qrcode_Matrix.points.map(
      ({x, y, estimatedModuleSize}) => ({x, y, size: estimatedModuleSize})
    ),
  }
  // alert("Time:" + time + " Code: "+str);
}

qrcode_.getPixel = function (x, y) {
  if (qrcode_.width < x) {
    throw 'point error'
  }
  if (qrcode_.height < y) {
    throw 'point error'
  }
  const point = (x * 4) + (y * qrcode_.width * 4)
  const p = (qrcode_.imagedata.data[point] * 33 + qrcode_.imagedata.data[point + 1] * 34 + qrcode_.imagedata.data[point + 2] * 33) / 100
  return p
}

qrcode_.binarize = function (th) {
  const ret = new Array(qrcode_.width * qrcode_.height)
  for (let y = 0; y < qrcode_.height; y++) {
    for (let x = 0; x < qrcode_.width; x++) {
      const gray = qrcode_.getPixel(x, y)

      ret[x + y * qrcode_.width] = gray <= th
    }
  }
  return ret
}

qrcode_.getMiddleBrightnessPerArea = function (image) {
  const numSqrtArea = 4
  // obtain middle brightness((min + max) / 2) per area
  const areaWidth = Math.floor(qrcode_.width / numSqrtArea)
  const areaHeight = Math.floor(qrcode_.height / numSqrtArea)

  const ay = 2
  const ax = 2

  const starty = areaHeight * ay
  const startx = areaWidth * ax
  let startidx = starty * qrcode_.width + startx
  let min = 0xFF
  let max = 0

  for (let dy = 0; dy < areaHeight; dy++) {
    let idx = startidx
    for (let dx = 0; dx < areaWidth; dx++) {
      const target = image[idx++]
      if (target < min) {
        min = target
      }
      if (target > max) {
        max = target
      }
    }
    startidx += qrcode_.width
  }
  return Math.floor((min + max) / 2)
}

qrcode_.grayScaleToBitmap = function (grayScale) {
  const t = qrcode_.getMiddleBrightnessPerArea(grayScale)
  return grayScale.map(v => v < t)
}

qrcode_.grayscale = function () {
  const buff = new ArrayBuffer(qrcode_.width * qrcode_.height)
  const ret = new Uint8Array(buff)
  // var ret = new Array(qrcode_.width*qrcode_.height);

  for (let y = 0; y < qrcode_.height; y++) {
    for (let x = 0; x < qrcode_.width; x++) {
      const gray = qrcode_.getPixel(x, y)

      ret[x + y * qrcode_.width] = gray
    }
  }
  return ret
}

function URShift(number, bits) {
  if (number >= 0) {
    return number >> bits
  } else {
    return (number >> bits) + (2 << ~bits)
  }
}

const qrcode = qrcode_

export {URShift, qrcode}
