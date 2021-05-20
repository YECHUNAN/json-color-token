# Release Notes

## 1.0.0

- Support previwing hex color tokens which contains only rgb values in json files.
- Support editing hex color token's rgb value using the built-in color editor in json files.

## 1.0.1

- Add icon for extension.

## 1.1.0

- New feature:
  - The extension will now cache color tokens in opened json files and show color preview in css/less files when the variable names match. Note: if multiple opened json files provide the same color token, the language server will only preview that color token in one of these opened json files. 
- Change the defualt number of maximum color token for preview from 100 to be 1000.
- Hex color token preview now support alpha values.
- Hex color token editor can now edit the alpha value using the built-in color editor.