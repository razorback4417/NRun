import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Button,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

// You can import from local files
import StravaConnect from './components/StravaConnect';
import BackApp from './components/BackApp';
//import getTokens, { tokenValues } from './components/getTokens.js';

// or any pure javascript modules available in npm
import { Card } from 'react-native-paper';

import * as Google from 'expo-google-app-auth';

import moment from 'moment';
import DatePicker from 'react-native-datepicker';

const CLIENT_ID = 68041;
const CLIENT_SECRET = '57dc2f05434c1120d84ed5111f607dc964fba01d';

const initialUrl = `http://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=https://localhost/exchange_token&approval_prompt=force&scope=activity:read_all`;

//const callActivities = `https://www.strava.com/api/v3/athlete/activities?access_token=`;

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
    projectTime: null,
    projectSec: null,
    beforeDate: moment().format('M/D/YYYY'),
    afterDate: moment().subtract(3, 'months').format('M/D/YYYY'),
    //minDate: moment().subtract(24, 'months').format('M/D/YYYY'),
    showDateRange: false,
  };

  toggleView = () => {
    console.log('pressed');
    this.setState({ buttonShow: false });
    this.setState({ webView: true });
  };

  //Get authorization code
  _onNavigationStateChange = (navState) => {
    console.log('navState=', navState);
    const auxDomain = navState.url.split('https://');
    const domain = auxDomain[1].split('/');
    console.log(domain[0]);

    if (domain[0] === 'localhost') {
      try {
        console.log('FINAL NAVURL: ' + navState.url);
        const aux = navState.url.split('code=');
        //console.log('AUX = ' + aux);0
        const code = aux[1].split('&scope');
        console.log('CODE = ' + code[0]);
        this.setState({ code: code[0] });
        this.setState({ webView: false });
        this.setState({ showDateRange: true });
      } catch (e) {
        console.log(e);
      }
    }
  };

  getTokens = (code) => {
    const grantType = 'authorization_code';
    const url = `https://www.strava.com/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=${grantType}&code=${code}`;

    if (this.state.accessToken === '') {
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
        console.log('name=', name);
        this.setState({ expiresAt: expiresAt });
        this.setState({ accessToken: accessToken });
        this.setState({ refreshToken: refreshToken });
        this.getActivities(accessToken);
      });
    }
    this.getActivities(this.state.accessToken);
  };

  // use current access token to call all activities
  getActivities(accessToken) {
    var beforeEpochTime = moment(this.state.beforeDate, 'M/D/YYYY').unix();
    var afterEpochTime = moment(this.state.afterDate, 'M/D/YYYY').unix();
    var callActivitiesURL = `https://www.strava.com/api/v3/athlete/activities?before=${beforeEpochTime}&after=${afterEpochTime}&access_token=`;
    console.log(callActivitiesURL + accessToken);
    fetch(callActivitiesURL + accessToken)
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
    return 34166.4689 / (b ** 0.857);
  }

  showActivities(activities) {
    console.log('ACTIVITIES.LENGTH: ' + activities.length);
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
    console.log("fivetime: " + fiveTime)

    var fiveMin = parseFloat(fiveTime.toString().substring(0, 3));

    var fiveStr = fiveTime.toString().substring(3, 5);
    console.log("fiveStr: " + fiveStr)
    var fiveSec = (parseInt(fiveStr) / 100) * 60;
    fiveSec = Math.floor(fiveSec)
    console.log(fiveSec)

    if (!fiveMin) {
      this.setState({ projectTime: 'Invalid Data' });
    } else {
      this.setState({ projectTime: fiveMin });
      this.setState({ projectSec: fiveSec });
    }
    this.setState({ calcDone: true });

    //console.log("whole thing", fiveTime.toString())
    //console.log("fiveStr=", fiveStr);

    //console.log('fiveSec', fiveSec);c

    //this.setState({ calcDone: true });
  }

  showWebView() {
    return (
      <View style={{ height: 475 }}>
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

  loginButton() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            this.setState({ buttonShow: false });
            this.setState({ webView: true });
            this.showWebView()
          }}>
          <StravaConnect />
        </TouchableOpacity>
      </View>
    );
  }

  showHeader() {
    return <BackApp />;
  }

  showCalc() {
    return (
      <View style={styles.calculation}>
        <Text style={styles.titleText}>5K Projection:</Text>
        <Text style={styles.time}>
          {this.state.projectTime == 'Invalid Data' ? (
            <Text>{this.state.projectTime}</Text>
          ) : null}
          {this.state.projectTime != 'Invalid Data' ? (
            <Text>
              {this.state.projectTime} min {this.state.projectSec} sec{' '}
            </Text>
          ) : null}
        </Text>
      </View>
    );
  }

  getDateRange() {
    return (
      //<SafeAreaView style={styles.container}>
      <View
        style={{
          marginLeft: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={styles.paragraph}>Getting runs after</Text>
        <DatePicker
          date={this.state.afterDate} // Initial date from state, subtract 3 months from current date
          mode="date" // The enum of date, datetime and time
          placeholder="select date"
          format="MM-DD-YYYY"
          //minDate={this.state.minDate} // subtract 1 year from current date
          maxDate={this.state.beforeDate} // current date
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          customStyles={{
            dateIcon: {
              //display: 'none',
              position: 'absolute',
              left: 0,
              top: 4,
              marginLeft: 0,
            },
            dateInput: {
              marginLeft: 36,
            },
          }}
          onDateChange={(date) => {
            this.setState({ afterDate: date });
          }}
        />
        <Text style={styles.paragraph}>and before</Text>
        <DatePicker
          date={this.state.beforeDate} // current date
          mode="date" // The enum of date, datetime and time
          placeholder="select date"
          format="MM-DD-YYYY"
          //minDate={this.state.minDate} // subtract 1 year from current date
          maxDate={this.state.beforeDate} // current date
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          customStyles={{
            dateIcon: {
              //display: 'none',
              position: 'absolute',
              left: 0,
              top: 4,
              marginLeft: 0,
            },
            dateInput: {
              marginLeft: 36,
            },
          }}
          onDateChange={(date) => {
            this.setState({ beforeDate: date });
          }}
        />
        <Pressable
          style={styles.button}
          onPress={() => {
            //this.setState({ showDateRange: !this.state.showDateRange });
            {
              this.getTokens(this.state.code);
            }
          }}>
          <Text style={styles.buttonText}> Calculate </Text>
        </Pressable>
      </View>
      //</SafeAreaView>
    );
  }

  render() {
    return (
      <View>
        {this.showHeader()}
        {this.state.buttonShow && this.loginButton()}
        {this.state.webView && this.showWebView()}
        {this.state.showDateRange && this.getDateRange()}
        {this.state.calcDone && this.showCalc()}
      </View>
    );
  }
}

//{this.state.googleLogin && signInAsync}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  button: {
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '35%',
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'black',
  },
  calculation: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 50,
  },
  time: {
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 35,
    fontWeight: '10px',
  },
  titleText: {
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 20,
    paddingTop: 10,
  },
  paragraph: {
    alignItems: 'center',
    marginLeft: 35,
    justifyContent: 'center',
    fontFamily: 'HelveticaNeue-Thin',
    fontSize: 15,
    paddingTop: 10,
    fontStyle: 'italic',
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
