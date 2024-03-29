# Release Notes

## 1.0.0

- Support previewing hex color tokens which contains only RGB values in json files.
- Support editing hex color token's RGB value using the built-in color editor in json files.

## 1.0.1

- Add icon for extension.

## 1.1.0

- New feature:
  - The extension will now cache color tokens in opened json files and show color preview in css/less files when the variable names match. Note: if multiple opened json files provide the same color token, the language server will only preview that color token in one of these opened json files. 
- Change the default number of maximum color token for preview from 100 to be 1000.
- Hex color token preview now support alpha values.
- Hex color token editor can now edit the alpha value using the built-in color editor.

## 1.2.0

- License change

  For simplicity, I decided to avoid the trouble of maintaining two different types of software license and just use MIT license for all the source code contributed on top of the Microsoft sample language service provider extension, which is already licensed under MIT. The LICENSE file and the license headers have been updated to reflect the change.

- New feature:

  - Add a setting to allow applying the color token detection and previewing feature on any language except for css and less.
  - Add the "Go to definition" support for referenced css variables. If json documents with color tokens are open and there is a css/less document referencing them as css variables, applying "Go to definition" on the line of referenced variable will bring the editor to the location in the json documents where the color tokens are defined.

- Known issues:

  The language server is only able to parse color tokens in JSON files and preview them in css/less files. This is due to the lack of a standard parser for non-JSON formatted configuration files in NodeJS.