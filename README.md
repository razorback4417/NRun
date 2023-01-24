# NRun
<em>Prediction Running App using Strava API<em>
Developed on the Snack platform. 

Using an algorithm developed with John Monz, AP Statistics teacher at Weston High School, and XC/track coach, we are able to use runner data to predict their 5k times during a race. The app scrapes runner data from respective Strava accounts, applies it to the algorithm, and outputs the projected race time.

The app has a social aspect to share and comment on predictions.

**See the master branch for main code.**


Over the summer, I had time to develop a running app with the React Native programming language: NRun. NRun syncs with Strava running data to provide projections of 5k race times.

I am deploying the app through Apple’s Test Flight, which makes it easy to invite users to test apps in order to collect feedback before officially releasing the app on the App Store.

To install the app, simply click on the link below. 

Important note: the algorithm (formalized with Coach Monz) used to calculate the 5k projection takes account for effort level (easy, moderate, hard). Include one of these terms (easy, moderate, hard) in the title of your Strava runs for appropriate results.

https://testflight.apple.com/join/WIkDU1RL (beta ended during the 2021 outdoor season).

Features in the work include a feature that converts 5k times into workout paces (e.g. easy runs, track workouts, tempos, etc) and an updated user interface.

Snack - https://github.com/expo/snack/ </br>
Strava - https://developers.strava.com/
