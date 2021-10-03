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

If referenced in a css file, the referenced variables will show the color preview

![rendererd-sample-css](https://raw.githubusercontent.com/YECHUNAN/json-color-token/f0aa8b63417144abf99fcff37edada1e54e8dc96/images/readme-sample-css.jpg)

## Features

- Preview visual color from hex color tokens in json files.
- Cache variables in opened json files that are like color tokens and preview them in referenced css/less files.
- Adjust color using the built-in color picker in json files.

## External credits

The extension icon is designed using resources from Flaticon.com.

## Release notes

See features and fixes for each released versions at [release notes](https://github.com/YECHUNAN/json-color-token/blob/main/ReleaseNotes.md).

## License

Excluding all the node modules, which have their own licenses and are obvious what those licenses are, a significant portion of the source code in the extension is contributed by Microsoft under the MIT license in their sample language service provider project [lsp-sample](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample). All the source code that originated from the lsp-sample project have the license header in the file and are subject to the original MIT license. All the source code contributed by other authors are in MIT license as well.
