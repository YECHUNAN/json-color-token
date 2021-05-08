# JSON color token

This repo implements a language server for VSCode. The language server can be installed as an extension. The extension enables hex color token detection in JSON files, provides color preview and color editing through the built-in color picker.

## Example

A json file with hex color tokens

```json
{
	"colorA": "#DB3333",
	"colorB": "#B9EC2B"
}
```

will be rendered as

![rendered-sample](https://raw.githubusercontent.com/YECHUNAN/json-color-token/fc12dbcd57b628ee613bee86f9031500fc5fb870/testfiles/readme-sample-json.jpg)

## Features

- Preview visual color from hex color tokens in json files.
- Cache variables in opened json files that are like color tokens and preview them in referenced css/less files.
- Adjust color using the built-in color picker in json files.

## External credits

The extension icon is designed using resources from Flaticon.com.

## Release Notes

### 1.0.0

- Support previwing hex color tokens which contains only rgb values in json files.
- Support editing hex color token's rgb value using the built-in color editor in json files.

### 1.0.1

- Add icon for extension.

### 1.1.0

- New feature:
  - The extension will now cache color tokens in opened json files and show color preview in css/less files when the variable names match.
- Change the defualt number of maximum color token for preview from 100 to be 1000.
- Hex color token preview now support alpha values.
- Hex color token editor can now edit the alpha value using the built-in color editor.
