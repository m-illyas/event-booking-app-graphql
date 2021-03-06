import React, {Component} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-community/async-storage';
import Colors from '../styles/Colors';
import Input from '../components/Input';
import Button from '../components/Button';

export default class EventsScreen extends Component {
  state = {
    date: new Date(),
    title: '',
    price: '',
    description: '',
    token: null,
    events: null,
    userId: null,
    loading: false,
    dummy: false,
  };
  componentDidMount() {
    this.getData();
    this.fetchData();
  }

  getData = async () => {
    try {
      const value = await AsyncStorage.getItem('@storage_Key');
      const userId = await AsyncStorage.getItem('@userId');
      if (value !== null) {
        this.setState({token: value});
        this.setState({userId});
        return;
      }
    } catch (e) {
      // error reading value
    }
  };

  removeValue = async () => {
    try {
      await AsyncStorage.removeItem('@storage_Key');
      await AsyncStorage.removeItem('@userId');
      this.props.navigation.navigate('Login');
    } catch (e) {
      // remove error
    }

    console.log('Done.');
  };

  fetchData = () => {
    this.setState({loading: true});
    const requestBody = {
      query: `
          query {
            events {
              _id
              title
              description
              date
              price
              creator {
                _id
                email
              }
            }
          }
        `,
    };

    fetch('https://event-booking-app-graphql.herokuapp.com/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Failed!');
        }
        return res.json();
      })
      .then((resData) => {
        console.log(resData);
        this.setState({events: resData.data.events, loading: false});
        // const events = resData.data.events;
        // if (this.isActive) {
        //   this.setState({events: events, isLoading: false});
        // }
      })
      .catch((err) => {
        console.log(err);
        if (this.isActive) {
          this.setState({loading: false});
        }
      });
  };

  bookEvents = () => {
    const requestBody = {
      query: `
          mutation {
            bookEvent(eventId:"${this.state.selectedEvent._id}") {
              _id
            createdAt
            updatedAt
           
            }
          }
        `,
    };

    fetch('https://event-booking-app-graphql.herokuapp.com/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.state.token,
      },
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Failed!');
        }
        return res.json();
      })
      .then((resData) => {
        this.setState({events: resData.data.event});
        // const events = resData.data.events;
        // if (this.isActive) {
        //   this.setState({events: events, isLoading: false});
        // }
      })
      .catch((err) => {
        if (this.isActive) {
          this.setState({isLoading: false});
        }
      });
  };

  submitHandler = () => {
    const {title, description, date} = this.state;
    const price = +this.state.price;

    const requestBody = {
      query: `
          mutation CreateEvent($title: String!, $desc: String!, $price: Float!, $date: String!) {
            createEvent(eventInput: {title: $title, description: $desc, price: $price, date: $date}) {
              _id
              title
              description
              date
              price
            }
          }
        `,
      variables: {
        title: title,
        desc: description,
        price: price,
        date: date,
      },
    };

    fetch('https://event-booking-app-graphql.herokuapp.com/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.state.token,
      },
    })
      .then((res) => {
        console.log(res.status);
        if (res.status !== 200 && res.status !== 201) {
          throw new Error('Failed!');
        }
        return res.json();
      })
      .then((resData) => {
        console.log(resData);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  renderItem = ({item}) => {
    return (
      <TouchableOpacity
        onPress={() => {
          this.props.navigation.navigate('Bookings', {
            item: item,
            token: this.state.token,
          });
        }}>
        <View
          item={item}
          style={{
            backgroundColor: 'pink',
            marginHorizontal: 25,
            marginTop: 10,
          }}>
          <Text>{item.title}</Text>
          {this.state.userId === item.creator._id && (
            <Text>You are the owner of the event</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  render() {
    return (
      <SafeAreaView style={styles.container}>
        {/* <TextInput
          style={styles.input}
          placeholder="Title"
          onChangeText={(title) => {
            this.setState({title});
          }}
        /> */}
        <Input
          placeholder="Title"
          onChangeText={(title) => {
            this.setState({title});
          }}
        />
        <Input
          placeholder="Price"
          onChangeText={(price) => {
            this.setState({price});
          }}
        />

        <DateTimePicker
          testID="dateTimePicker"
          value={this.state.date}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || this.state.date;
            console.log(currentDate);
            this.setState({date: currentDate});
          }}
        />
        <Input
          placeholder="Description"
          onChangeText={(description) => {
            this.setState({description});
          }}
        />
        <View>
          <Button label={'CREATE EVENT'} onPress={this.submitHandler} />
          <Button label={'CANCEL'} onPress={() => {}} />
          <Button label={'LOGOUT'} onPress={this.removeValue} />
        </View>
        {this.state.loading ? (
          <Text>loading...</Text>
        ) : (
          <FlatList
            data={this.state.events}
            renderItem={this.renderItem}
            keyExtractor={(item) => item._id}
          />
        )}
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  input: {
    margin: 15,
    borderColor: 'black',
    borderWidth: 1,
  },
  container: {
    paddingEnd: 20,
    paddingStart: 20,
    backgroundColor: Colors.green1,
    flex: 1,
  },
  buttonStyle: {
    width: 100,
    height: 25,
    backgroundColor: 'pink',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
