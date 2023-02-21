import {qrcode} from './jsqrcode/src/qrcode'

// Define a custom pipeline module. This module scans the camera feed for qr codes, and makes the
// result available to other modules in onUpdate. It requires that the CameraPixelArray module is
// installed and configured to provide a luminance (black and white) image.
const qrprocessPipelineModule = () => ({
  name: 'qrprocess',
  onProcessCpu: ({processGpuResult}) => {
    // Check whether there is any data ready to process.
    if (!processGpuResult.camerapixelarray || !processGpuResult.camerapixelarray.pixels) {
      return {found: false}
    }

    try {
      // Set input variables on the global qrcode object before calling qrcode.process().
      const {rows, cols} = processGpuResult.camerapixelarray
      qrcode.width = cols
      qrcode.height = rows
      qrcode.grayscale = () => processGpuResult.camerapixelarray.pixels
      const res = qrcode.process()  // Scan the image for a QR code.
      res.points = res.points.map(
        ({x: x_, y: y_}) => ({x: x_ / (cols - 1), y: y_ / (rows - 1)})
      )
      return res
    } catch (e) {
      return {found: false}  // jsqrcode throws errors when qr codes are not found in an image.
    }
  },
})

// Define a custom pipeline module. This module updates UI elements with the result of the QR code
// scanning, and navigates to the found url on any tap to the screen.
const qrdisplayPipelineModule = () => {
/// ///cardplacement variables
  const cardplacedown = document.getElementsByClassName('cardplacetop')[0]
  // const cardresize = document.getElementsByClassName('cardplacebot')[0]
  // const cardplacetop = document.getElementsByClassName('cardplacebot')[0]
  const isCardBot = cardplacedown.classList.contains('cardplacebot')
  const titlename = document.title
  // let onceSeen = false         
  const url = document.getElementById('url')
  const json = document.getElementById('json')
  const canvas2d_ = document.getElementById('overlay2d')
  const ctx_ = canvas2d_.getContext('2d')
  let lastSeen = 0
  let canvas_
  // if the window is touched anywhere, navigate to the URL that was detected.
  window.addEventListener('touchstart', () => {
    if (!url.href || !url.href.startsWith('http')) {
      return
    }
    XR8.pause()
    // cardresize.setAttribute('class', 'cardplacemid');
    url.innerHTML = `Navigating to (title) ${url.title} at  <p class="displayurl"> ${url.href} </p>`
    //  title.innerHTML = ' ${title} '
    window.location.href = url.href
  })
  // TO DO ////
  /// include a confirmation message of do you want to go to this page?///
  /// ///////include a button to tap confirm
  /// /////////////////////////////////////////////////////////////////////

  // Keep the 2d drawing canvas in sync with the camera feed.
  const onCanvasSizeChange = () => {
    canvas2d_.width = canvas_.width
    canvas2d_.height = canvas_.height
  }

  // found QR code feedback
  const drawCircle = (pt) => {
    ctx_.beginPath()
    ctx_.arc(pt.x, pt.y, 9 /* radius */, 0, 2 * Math.PI, false)
    ctx_.fillStyle = '#AD50FF'
    ctx_.fill()
    ctx_.strokeStyle = '#7611B7'
    ctx_.lineWidth = 2
    ctx_.stroke()
  }

  const mapToTextureViewport =
    (pt, vp) => ({x: pt.x * vp.width + vp.offsetX, y: pt.y * vp.height + vp.offsetY})

  return {
    name: 'qrdisplay',
    onStart: ({canvas}) => {
      url.style.visibility = 'visible'  // Show the card that displays the url.
      canvas_ = canvas
    },
    onUpdate: ({processGpuResult, processCpuResult}) => {
      if (!processCpuResult.qrprocess) {
        return
      }

      canvas2d_.width = canvas2d_.width  // Clears canvas
      let {found, foundText, points} = processCpuResult.qrprocess
      const {viewport} = processGpuResult.gltexturerenderer
      // const jsonview =  document.getElementById.("titleAR");
      // const urlview = null;
      // Toggle display text based on whether a qrcode result was found.
      // console.log(document)

      if (found) {
        if (foundText.startsWith("http")){
          url.innerHTML = `<b class="displaytitle" id="titleplace"></b> <br>
          <p class="displayurl"><u> ${foundText}</u></p> 
          <p class="displayp">This is information about the page you are about to look at.</p>
          <p class="fakebutton">Tap to Open ></p>`
          console.log("found WebsiteLink")
           cardplacedown.setAttribute('class', 'cardplacebot')
           // <img src="assets/rcyl.jpg"  alt="Red Cylinder sculpture." width="200" height="200">
           // <img src="https://picsum.photos/id/57/600/500" alt="A street preview of a cobble street with tall buildings around it." width="300" height="200">
           // some sort of graphic to validate you found it (like a check mark image)
           url.href = foundText
        lastSeen = Date.now()
          points.forEach((pt) => {
          drawCircle(mapToTextureViewport(pt, viewport))
         })
       } else if (foundText.startsWith("{")){
         console.log("starts w/ {")
          let qrjson;
          try {
            qrjson = JSON.parse(foundText);
          } catch(err) {
            found=false;
              // console.log("error not found")
          }
          if (found) {
            console.log(qrjson)
          //  const listJson = document.createElement('li')
            // listJson.innerHTML = `<b> ${qrjson.title} </b> `
            const authorSplit = qrjson.authors
            const platform = qrjson["web-based"]
            const authorUI = authorSplit.toString().replace(",", ", ");
            let experienceType = '';
            if (platform == false){
                experienceType = "is not a web based experience"
            }else{
              experienceType = "is web based"
            }

          url.innerHTML = `<b> ${qrjson.title} </b><p>${authorUI}</p> <p>${experienceType}</p> `
            // json.appendChild(listJson)
          }
        }
      } else if (Date.now() - lastSeen > 5000) {
        url.innerHTML = '<b style="padding: 5px;">Point device at a QR Code</b> <img src="https://picsum.photos/id/57/600/500" alt="A street preview of a cobble street with tall buildings around it." width="200" height="100">'
        /////
          //if statement for running once
          // const fragment = document.createDocumentFragment();
          // const li = fragment
          //   .appendChild(document.createElement('ul'))
          //   .appendChild(document.createElement('li'));
          // li.textContent = 'hello world';
          // url.appendChild(fragment);
          
        //
          // const newElement = document.createElement("p")
          // newElement.innerText = "hi";
          // url.appendChild(newElement)
          // console.log(url.innerHTML)
        /////
        if (isCardBot) {
          cardplacedown.setAttribute('class', 'cardplacetop')
          console.log('setting card placement to top')
        }
        // <img src="assets/icons/qricon.png" alt="Icon of a QR code." width="200" height="200">'
        // <br> Point your phone at a QR Code to continue
        // some sort of graphic to show what to do
        url.href = ''
      }
    },
    onCanvasSizeChange,
  }
}

export {qrprocessPipelineModule, qrdisplayPipelineModule}
