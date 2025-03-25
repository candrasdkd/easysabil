const { getDefaultConfig } = require("@react-native/metro-config");
const { withMonicon } = require("@monicon/metro");

const config = getDefaultConfig(__dirname);

const configWithMonicon = withMonicon(config, {
  icons: [
    "ic:outline-settings",
    "mdi-light:settings",
    "material-symbols:arrow-back-ios-new-rounded",
    "material-symbols:arrow-forward-ios-rounded",
    "material-symbols:delete-outline-sharp",
    "material-symbols:upload-rounded",
    "material-symbols:motion-play-outline",
    "material-symbols:android-camera-outline",
    "material-symbols:arrow-back-rounded",
    "material-symbols:add",
    "material-symbols:cloud-download",
    "material-symbols:zoom-in-rounded",
    "material-symbols:zoom-out-rounded",
    "material-symbols:archive-rounded",
    "mdi:archive-check",
    "pajamas:scroll-up",
    "tdesign:clear-filled",
    "material-symbols:edit-square-outline",
    "material-symbols:folder-open-rounded",
    "material-symbols:chevron-right-rounded",
    "material-symbols:check-box",
    "material-symbols:cancel",
    "material-symbols:check-box-outline-blank",
    "material-symbols:check-box-rounded",
    "material-symbols:filter-alt",
    "mdi:checkbox-blank-circle-outline",
    "mdi:checkbox-marked-circle"

  ],
  // Load all icons from the listed collections
  collections: ["radix-icons"],
});

module.exports = configWithMonicon;