/**
 * Expo config plugin to enable modular headers for Google pods.
 * Fixes CocoaPods issues with AppCheckCore, GoogleUtilities, and RecaptchaInterop
 * without requiring useFrameworks: "dynamic" which breaks react-native-netinfo linking.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGoogleModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        console.log('⚠️  Podfile not found, skipping modular headers injection');
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // Check if modular headers are already configured
      if (podfileContent.includes('# Google pods modular headers')) {
        console.log('✓ Google modular headers already configured');
        return config;
      }

      // Find the target block (usually 'target ... do')
      const targetMatch = podfileContent.match(/target\s+['"]([^'"]+)['"]\s+do/);
      if (!targetMatch) {
        console.warn('⚠️  Could not find target block in Podfile');
        return config;
      }

      // Inject modular headers configuration right after the target line
      const targetLine = targetMatch[0];
      const modularHeadersConfig = `
  # Google pods modular headers - fixes AppCheckCore/GoogleUtilities/RecaptchaInterop
  # without requiring useFrameworks: "dynamic" which breaks react-native-netinfo
  pod 'GoogleUtilities', :modular_headers => true
  pod 'RecaptchaInterop', :modular_headers => true
  pod 'AppCheckCore', :modular_headers => true
`;

      podfileContent = podfileContent.replace(
        targetLine,
        targetLine + modularHeadersConfig
      );

      // Add post_install hook to fix deployment targets
      if (!podfileContent.includes('# Fix deployment targets')) {
        const postInstallHook = `
post_install do |installer|
  # Fix deployment targets - ensure all pods use iOS 15.1 minimum
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end
  end
end
`;

        // Append at the end of the file
        podfileContent += postInstallHook;
      }

      fs.writeFileSync(podfilePath, podfileContent, 'utf-8');
      console.log('✓ Injected modular headers for Google pods');
      console.log('✓ Added post_install hook to fix deployment targets');

      return config;
    },
  ]);
};
