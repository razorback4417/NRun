import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// You can import from local files
import StravaConnect from './components/StravaConnect';
import BackApp from './components/BackApp';
//import getTokens, { tokenValues } from './components/getTokens.js';

// or any pure javascript modules available in npm
import { Card } from 'react-native-paper';

const CLIENT_ID = 68041;
const CLIENT_SECRET = '57dc2f05434c1120d84ed5111f607dc964fba01d';

const initialUrl = `http://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=https://localhost/exchange_token&approval_prompt=force&scope=activity:read_all`;

const callActivities = `https://www.strava.com/api/v3/athlete/activities?access_token=`;

export default class App extends React.Component {
  state = {
    url: initialUrl,
    webView: false,
    buttonShow: true,
    code: '',
    expiresAt: '',
    accessToken: '',
    refreshToken: '',
    calcDone: false,
    projectTime: 0,
    projectSec: 0,
  };

  toggleView = () => {
    console.log('pressed');
    this.setState({ webView: true });
    this.setState({ buttonShow: false });
  };

  //Get authorization code
  _onNavigationStateChange = (navState) => {
    //console.log('navState=', navState);
    const auxDomain = navState.url.split('https://');
    const domain = auxDomain[1].split('/');
    console.log(domain[0]);

    if (domain[0] === 'localhost') {
      try {
        const aux = navState.url.split('code=');
        //console.log('AUX = ' + aux);
        const code = aux[1].split('&scope');
        //console.log('CODE = ' + code[0]);
        this.setState({ code: code[0] });
        this.setState({ webView: false });
      } catch (e) {
        console.log(e);
      }
    }
  };

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
        const sex = parsedRes.athlete.sex;
        //console.log('expireAt=', expiresAt);
        //console.log('accessToken=', accessToken);
        //console.log('refreshToken=', refreshToken);
        console.log('name=', name);
        //console.log('sex=', sex);
        this.setState({ expiresAt: expiresAt });
        this.setState({ accessToken: accessToken });
        this.setState({ refreshToken: refreshToken });
        this.getActivities(accessToken);
      });
  };

  // use current access token to call all activities
  getActivities(accessToken) {
    console.log(callActivities + accessToken);
    fetch(callActivities + accessToken)
      .then((res) => res.json())
      .then((data) => {
        console.log('data=', data);
        this.showActivities(data);
      })
      .catch((e) => console.log(e));
  }

  //function below is in charge of executing the algorithm
  algorType(constant, power, d, t) {
    var denom = ((t / 60 / (d / 1609.344)) * 60) ** power;
    //console.log("constant=", constant, "denom=", denom)
    var res = constant / denom;
    //console.log("res=", res)
    return res;
  }

  averageArr(arr) {
    var i;
    var total = 0;
    console.log('arr length=', arr.length);
    for (i = 0; i < arr.length; i++) {
      total += arr[i];
    }
    return total / arr.length;
  }

  pointToFive(b) {
    return 34166.4689 / b ** 0.857;
  }

  showActivities(activities) {
    console.log('activities= ', activities);
    var i;
    var distance = 0;
    var ez = [];
    var mod = [];
    var hard = [];

    for (i = 0; i < activities.length; i++) {
      var obj = activities[i];
      if (!(obj == undefined) && obj.type === 'Run') {
        var effort = obj.name.toLowerCase();
        if (effort.includes('easy')) {
          //console.log("easy=", obj.distance)
          ez.push(
            this.algorType(115959.9324, 1.25, obj.distance, obj.moving_time)
          );
        } else if (effort.includes('moderate')) {
          //console.log("moderate=", obj.distance)
          mod.push(
            this.algorType(86855.4047, 1.24, obj.distance, obj.moving_time)
          );
        } else if (effort.includes('hard')) {
          //console.log("hard=", obj.distance)
          hard.push(
            this.algorType(54230.5673, 1.162, obj.distance, obj.moving_time)
          );
        }
        //console.log('distance=', obj.distance);
        distance += obj.distance;
      }
    }
    //endfor
    console.log('ez=', ez);
    console.log('mod=', mod);
    console.log('hard=', hard);

    var subFinals = [];
    subFinals.push(this.averageArr(ez));
    subFinals.push(this.averageArr(mod));
    subFinals.push(this.averageArr(hard));

    var pointFinal = this.averageArr(subFinals);
    var fiveTime = this.pointToFive(pointFinal) / 60;
    fiveTime = Math.round(fiveTime * 100) / 100;

    var fiveMin = parseFloat(fiveTime.toString().substring(0, 3));

    var fiveStr = fiveTime.toString().substring(3, 5);
    var fiveSec = (parseInt(fiveStr) / 10) * 60;

    //console.log("whole thing", fiveTime.toString())
    //console.log("fiveStr=", fiveStr);

    //console.log('fiveSec', fiveSec);

    this.setState({ projectTime: fiveMin });
    this.setState({ projectSec: fiveSec });
    this.setState({ calcDone: true });
  }

  showWebView() {
    return (
      <View style={{ height: 475 }}>
        <WebView
          userAgent={"Chrome/56.0.0.0 Mobile"}
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
  loginButton() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => this.toggleView()}>
          <StravaConnect />
        </TouchableOpacity>
      </View>
    );
  }

  showHeader() {
    return (
      <BackApp />
    )
  }

  showCalc() {
    return (
      <View style={styles.calculation}>
        <Text style={styles.titleText}>5K Projection:</Text>
        <Text style={styles.time}>
          {this.state.projectTime} min {this.state.projectSec} sec{' '}
        </Text>
      </View>
    );
  }

  render() {
    return (
      <View>
        {this.showHeader()}
        {this.state.buttonShow && this.loginButton()}
        {this.state.webView && this.showWebView()}
        {this.getTokens(this.state.code)}
        {this.state.calcDone && this.showCalc()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  calculation: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  time: {
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 35,
    fontWeight: "10px",
  },
  titleText: {
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 20,
    paddingTop: 10,
  },
});
