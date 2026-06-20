// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: 'AIzaSyAyrNDio8Uc7kzQsR5fkenWlaECrhar3IQ',
  authDomain: 'expense-tracker-web-app-7c1d1.firebaseapp.com',
  projectId: 'expense-tracker-web-app-7c1d1',
  storageBucket: 'expense-tracker-web-app-7c1d1.appspot.com',
  messagingSenderId: '924319318341',
  appId: '1:924319318341:web:f5b94b3a5d89b4b7d3fe2c',
  measurementId: 'G-T8HZWEXF29',
};

export const environment = {
  production: true,
  firebase: firebaseConfig,
  useAuthEmulator: false, // <— flag cho test
  authEmulatorHost: 'http://localhost:9099',
  apiUrl: 'http://localhost:3000',
  reactRemoteURL: 'https://expense-tracker-remote-react.firebaseapp.com/remoteEntry.js',
};
