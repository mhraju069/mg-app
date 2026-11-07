const {
  createRunOncePlugin,
  withProjectBuildGradle,
} = require("expo/config-plugins");

const SENTINEL = "// stripeTapAndPayResolutionFix";
const ROOT_PLUGIN = 'apply plugin: "expo-root-project"';

function withStripeTapAndPayResolution(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    if (contents.includes(SENTINEL)) {
      return modConfig;
    }

    if (!contents.includes(ROOT_PLUGIN)) {
      throw new Error("Could not find the Expo root plugin line in android/build.gradle");
    }

    const exclusion = `${SENTINEL}
// Stripe's optional Issuing provisioning SDK references Google's private TapAndPay SDK.
// This app does not use push provisioning, so exclude the unavailable artifact from Stripe's module.
subprojects { project ->
  if (project.name == 'stripe_stripe-react-native') {
    configurations.configureEach {
      exclude group: 'com.google.android.gms', module: 'play-services-tapandpay'
    }
  }
}

`;

    modConfig.modResults.contents = contents.replace(ROOT_PLUGIN, `${exclusion}${ROOT_PLUGIN}`);
    return modConfig;
  });
}

module.exports = createRunOncePlugin(
  withStripeTapAndPayResolution,
  "with-stripe-tapandpay-resolution",
  "1.0.0"
);
