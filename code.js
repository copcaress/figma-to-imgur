figma.showUI(__html__, { width: 320, height: 360 }); 

figma.ui.onmessage = async msg => {
  if (msg.type === 'upload') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify("Please select at least one frame.");
      return;
    }

    const uploadedUrls = [];

    for (const frame of selection) {
      let image;
      try {
        image = await frame.exportAsync({ format: 'PNG' });
        console.log('Image exported successfully');
      } catch (error) {
        console.error('Error exporting image:', error);
        figma.notify('Error exporting image.');
        return;
      }

      let base64Image;
      try {
        base64Image = base64ArrayBuffer(image);
        console.log('Image converted to base64 successfully:', base64Image);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        figma.notify('Error converting image to base64.');
        return;
      }

      try {
        const url = await uploadToImgur(base64Image);
        uploadedUrls.push(url);
        console.log('Image uploaded to Imgur successfully:', url);
      } catch (error) {
        console.error('Error uploading image to Imgur:', error);
        figma.notify('Error uploading image to Imgur.');
        return;
      }
    }

    console.log('All images uploaded, URLs:', uploadedUrls);
    figma.ui.postMessage({ type: 'upload-success', urls: uploadedUrls });
  }
};

function base64ArrayBuffer(arrayBuffer) {
  var base64 = '';
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  for (var i = 0; i < mainLength; i = i + 3) {
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;

    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;

    base64 += encodings[a] + encodings[b] + '==';
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;

    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  }

  return base64;
}

async function uploadToImgur(base64Image) {
  try {
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID YOUR CLIENT-ID -- https://dubble.so/guides/how-to-get-imgur-client-id-purlxhv84a0m3mlsiak7',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        type: 'base64',
      }),
    });

    const data = await response.json();
    if (data.success) {
      return data.data.link;
    } else {
      console.error('Imgur error response:', data);
      throw new Error(data.data.error);
    }
  } catch (error) {
    console.error('Upload to Imgur failed:', error);
    throw error;
  }
}
