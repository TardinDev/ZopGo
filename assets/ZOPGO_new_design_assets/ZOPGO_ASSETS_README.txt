
ZOPGO — App Assets Pack
=======================

Included files:

App Icons
---------
- zopgo_app_icon_1024.png — iOS App Store base (upload to App Store Connect; Xcode will derive sizes)
- zopgo_app_icon_512.png — Google Play icon (512x512, PNG, no rounded corners)

Android Adaptive Icon
---------------------
- zopgo_adaptive_foreground_432.png — 432x432 foreground
- zopgo_adaptive_background_108.png — 108x108 solid background (#14181E)
- ic_launcher_adaptive.xml — sample XML to place under res/mipmap-anydpi-v26/

Play Store Graphic
------------------
- zopgo_feature_graphic_1024x500.png — Feature graphic for Google Play

Splash Screens
--------------
- splash_ios_1242x2688_light.png
- splash_ios_1242x2688_dark.png
- splash_ios_2048x2732_light.png
- splash_ios_2048x2732_dark.png
- splash_android_1080x2400_light.png
- splash_android_1080x2400_dark.png

Expo Config Hints (app.json/app.config.ts)
------------------------------------------
{
  "expo": {
    "icon": "./assets/zopgo_app_icon_1024.png",
    "splash": {
      "image": "./assets/splash_android_1080x2400_light.png",
      "resizeMode": "contain",
      "backgroundColor": "#0E1218"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/zopgo_adaptive_foreground_432.png",
        "backgroundColor": "#14181E"
      }
    }
  }
}
