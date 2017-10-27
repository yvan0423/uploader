
# Uploader

----------

## Features

- A pure file uploader for custom files.
- A set of React component out of the box.
- The upload principle is based on qiniu [chunked-upload](https://developer.qiniu.com/kodo/manual/1650/chunked-upload) & [form-upload](https://developer.qiniu.com/kodo/manual/1272/form-upload);

## Environent Support

* Modern browsers and Internet Explorer 9+.
* Server-side Rendering.

----------

## Demo

### Fuck you!  No demo!

----------

## Usage

```jsx
import Uploader from 'uploader';
React.render(<Uploader />, mountNode);
```

----------

## Constructor Options

|Property|Description|Default|Type|
|:---|---|---|---|
|sliceSize|The size you want to slice for a large file, just less than or equal 4(MB).|4|number|
|isCover|wheather the file is cover|false|boolean|
|multiple|Whether to support selected multiple file.|false|boolean|
|tokenApi|Required.The api url for get upload token, the different api represent different namespace.|'/manage/upload/tokens'|string|
|beforeUpload|Hook function which will be executed before uploading. Uploading will be stopped with `false` or a rejected `Promise` returned. |(file, fileList) => ` boolean / Promise `|Function|
|fileAdded|A callback function,will be executed when file is selected.|(file, fileList) => {}|Function|
|onProgress|A callback function,will be executed when a file is uploading,it will return the uploaded chunksizes.|(file, size) => {}|Function|
|onUploaded|A callback function,will be executed when a file is uploaded.|(filePath) => {}|Function|
|onError|A callback function,will be executed when any xhr requests occur error.|(error) => {}|Function|
|disabled|Disable upload button.|false|boolean|
|noToken|A upload way doesn't need to get token,specially for upload operns.|false|boolean|


----------