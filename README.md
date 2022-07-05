# React Native App with Strava

This readme will cover the steps I went through to develop a React Native App that integrates with the Strava API.

# Creating your Strava Application

Follow steps A and B. Also feel free to experiment on Step E (Swagger) to learn about making requests to the Strava API.

[https://developers.strava.com/docs/getting-started/](https://developers.strava.com/docs/getting-started/)

## Client ID and Client Secret

After creating your application, take note of your Client ID and Client Secret.

# Snack Expo

[Snack](https://snack.expo.dev/) is an online React Native editor that allows you to create apps easily, and not worry about library setup, or simulation issues. 

## Running your App in Snack

I suggest using the "My Device" feature to test on your phone; this will end up saving up to hours of development (since you don't have to wait in the queue to run your app). 

*Note:* you will have to download the [Expo Go](https://expo.dev/client) app to test it on your phone.

[https://snack.expo.dev/@razorback/strava-react-native-example](https://snack.expo.dev/@razorback/strava-react-native-example)

All code can be found in this Snack above. As explained, you can test it on your own device, or use the simulator. Note that Snack will need time to set the application up, so wait a few seconds before clicking the "Connect with Strava" button.

## The Code

To understand the code, let's go through the steps required to authenticate in Strava. Further documentation on this process can be found on the [official Strava Docs](https://developers.strava.com/docs/authentication/).

![Untitled](React%20Native%20App%20with%20Strava%201b329bf138864abdb84d0f81eb9797d0/Untitled.png)

Authentication flowchart provided by Strava Developer

The important thing to understand is that Strava has their flow in place, and we will not have to code this portion. We just have to pay attention to 3 steps:

- Athlete clicks log in to your app (1)
    - Strava provides [official branding guidelines](https://developers.strava.com/guidelines/) if you wish to use their components (e.g. a Strava Connect Button. In the guidelines, they will also provide downloads to all the components.
    - This function of the app will simply be a trigger to calling the OAuth page. This step can be skipped if you wish for the OAuth page to pop up right away.
- Athlete redirected to OAuth page (2)

    The link to the Strava OAuth page is

    [`http://www.strava.com/oauth/authorize?client_id={INSERT}&response_type=code&redirect_uri=https://localhost/exchange_token&approval_prompt=force&scope=activity:{INSERT}``](http://www.strava.com/oauth/authorize?client_id=$%7BCLIENT_ID%7D&response_type=code&redirect_uri=https://localhost/exchange_token&approval_prompt=force&scope=activity:read_all%60)

    You will get the Client ID from your Strava App page, and the scope from experimentation in [Swagger](https://developers.strava.com/playground/). For connivence, below is a scope list.

    ![Screen Shot 2021-08-15 at 4.20.28 PM.png](React%20Native%20App%20with%20Strava%201b329bf138864abdb84d0f81eb9797d0/Screen_Shot_2021-08-15_at_4.20.28_PM.png)

    If we choose the `read_all` scope, we would replace `{INSERT}` with `read_all`, and likewise for other scope.

- Obtaining access token (7)

    After Strava takes the user through their authorization steps (steps 3 to 6), we will need to send a fetch for the tokens. These tokens will be necessary to scape user data. I strongly suggest to try scraping your own data using Swagger to see why this token is needed, and more importantly, have a better understanding of the Strava API.

## `WebView`

Although Apple has released an [announcement](https://developer.apple.com/news/?id=12232019b) that they will no longer accept new apps using `UIWebView` starting April 2020, React Native has adapted by [introducing an updated WebView](https://reactnative.dev/blog/2018/08/27/wkwebview) that utilizes `WKWebView`.

```jsx
showWebView() {
    return (
      <View style={{ height: 600 }}>
        <WebView
          userAgent={'Chrome/56.0.0.0 Mobile'}
          useWebKit={true}
          source={{ uri: this.state.url }}
          onNavigationStateChange={this._onNavigationStateChange.bind(this)}
          startInLoadingState={false}
          domStorageEnabled={true}
          scalesPageToFit={true}
          injectedJavaScript={this.state.cookie}
          javaScriptEnabled={true}
        />
      </View>
    );
  }
```

Important properties of the WebView to note:

- `userAgent`: We use a legacy version of Chrome in order to bypass a Google authorization error with WebViews.
- `source`: This is what the WebView will display. We store the OAuth page url in a state.
- `onNagivationStateChange`: This will inform us on what "step" of the Strava authentication process the WebView is on. This will be helpful so we know when to fetch the access token.

## `onNavigationStateChange`

*Getting the "code"*

```jsx
_onNavigationStateChange = (navState) => {
    //console.log('navState=', navState);
    const auxDomain = navState.url.split('https://');
    const domain = auxDomain[1].split('/');
    //console.log(domain[0]);

    if (domain[0] === 'localhost') {
      try {
        console.log('FINAL NAVURL: ' + navState.url);
        const aux = navState.url.split('code=');
        const code = aux[1].split('&scope');
        console.log('CODE = ' + code[0]);
        this.setState({ code: code[0] });
        this.setState({ webView: false });
      } catch (e) {
        console.log(e);
      }
    }
  };
```

This function is automatically called when the WebView changes its `navState`. Above, we parse the state to identify when the WebView has a navState with [localhost](http://localhost)- the step in which we can obtain the code. After parsing the url for the code, we can call a request for an access token to scrape Strava Data.

## `getToken`

*Getting the access token*

```jsx
getTokens = (code) => {
    const grantType = 'authorization_code';
    const url = `https://www.strava.com/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=${grantType}&code=${code}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .catch((err) => {
        console.log(err);
        alert('Error getting an authorization token!');
      })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error();
      })
      .then((parsedRes) => {
        const expiresAt = parsedRes.expires_at * 1000;
        const accessToken = parsedRes.access_token;
        const refreshToken = parsedRes.refresh_token;
        const name = parsedRes.athlete.firstname;
        this.setState({ expiresAt: expiresAt });
        this.setState({ accessToken: accessToken });
        this.setState({ refreshToken: refreshToken });
        this.getActivities(accessToken);
      });
  };
```

Using fetch, we can obtain the access token, as well as other information such as the expiration and refresh token. More information about relevancy to other information the fetch obtains is found on the Strava Docs.

## `getActivities`

```jsx
getActivities(accessToken) {
    console.log(callActivities + accessToken);
    fetch(callActivities + accessToken)
      .then((res) => res.json())
      .then((data) => {
        console.log('data=', data);
        this.doSomething(data);
      })
      .catch((e) => console.log(e));
  }
```

The getActivities function uses the token obtained to scrape the user data.

```jsx
const callActivities = `https://www.strava.com/api/v3/athlete/activities?access_token=`;
```

After obtaining the data, you can do what ever you want with it- analyze, display, organize, etc.
